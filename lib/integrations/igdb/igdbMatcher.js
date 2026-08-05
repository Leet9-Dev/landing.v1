// IGDB canonical game matcher.
//
// Supported IGDB external_games categories:
//   steam → 1  (uid = Steam App ID)
//   gog   → 17 (uid = GOG product ID)
//   epic  → 26 (uid = Epic slug/ID)
//   xbox  → 11 (uid = Xbox title ID)
//
// PSN NPWR* title IDs do not map to IGDB external_games UIDs — PSN is excluded.

import { igdbQuery, hasIgdbCredentials } from "./igdbClient";
import { prisma } from "@/lib/prisma";

const IGDB_CATEGORY = {
  steam: 1,
  gog: 17,
  epic: 26,
  xbox: 11,
};

function igdbCoverUrl(url) {
  if (!url) return null;
  return url.replace("t_thumb", "t_cover_big").replace(/^http:/, "https:");
}

/**
 * Shape a raw IGDB game object into the internal game DTO.
 * Compatible with MOCK_GAMES structure — consumed by me/games, me/stats, and Discovery.
 */
export function igdbGameToDto(igdbGame) {
  const developer = igdbGame.involved_companies?.find((c) => c.developer)?.company?.name ?? null;
  const publisher = igdbGame.involved_companies?.find((c) => c.publisher)?.company?.name ?? null;
  return {
    id: `igdb:${igdbGame.id}`,
    slug: igdbGame.slug || String(igdbGame.id),
    canonicalTitle: igdbGame.name,
    studio: developer ?? publisher ?? "Unknown",
    publisher: publisher ?? developer ?? "Unknown",
    description: igdbGame.summary ?? "",
    genres: igdbGame.genres?.map((g) => g.name) ?? [],
    tags: igdbGame.themes?.map((t) => t.name) ?? [],
    coverImageUrl: igdbCoverUrl(igdbGame.cover?.url) ?? null,
    coverGradient: null,
    heroGradient: null,
    sourcePlatforms: [],
    communityPlayerCount: 0,
    communityL9Points: 0,
    communityAchievements: 0,
    communityHours: 0,
    communityRating: igdbGame.rating ? Math.round(igdbGame.rating) / 100 : null,
    trendingRank: null,
    recentlyDetected: false,
    firstDetectedAt: null,
    lastDetectedAt: null,
  };
}

/**
 * Batch-resolve (platform, externalId[]) → Map<externalId, canonicalGameId | null>.
 *
 * Flow:
 *   1. One DB query to fetch all cached entries — cache hits are returned immediately.
 *   2. For cache misses: one IGDB external_games API call per 500 games (Apicalypse
 *      multi-uid filter), storing results + full game metadata in GameExternalSource.metadata.
 *   3. Never throws — returns null for any game IGDB can't resolve.
 *
 * Calling this once per sync instead of per-game eliminates the rate-limit risk and
 * replaces the previous N sequential IGDB calls with O(N/500) calls.
 */
export async function batchMatchToIgdb(platform, externalIds) {
  const category = IGDB_CATEGORY[platform];
  if (!category || !hasIgdbCredentials() || !externalIds.length) return new Map();

  const uids = externalIds.map(String);
  const providerKey = `igdb_${platform}`;

  // 1. Batch DB cache lookup — one query regardless of library size.
  const cached = await prisma.gameExternalSource.findMany({
    where: { provider: providerKey, externalGameId: { in: uids } },
    select: { externalGameId: true, canonicalGameId: true },
  }).catch(() => []);

  const result = new Map();
  const cachedSet = new Set();
  for (const row of cached) {
    result.set(row.externalGameId, row.canonicalGameId || null);
    cachedSet.add(row.externalGameId);
  }

  const misses = uids.filter((uid) => !cachedSet.has(uid));
  if (!misses.length) return result;

  // 2. IGDB API call for cache misses — up to 500 UIDs per request.
  try {
    const IGDB_BATCH = 500;
    for (let i = 0; i < misses.length; i += IGDB_BATCH) {
      const batch = misses.slice(i, i + IGDB_BATCH);
      const uidList = batch.map((u) => `"${u}"`).join(",");

      const igdbResults = await igdbQuery(
        "external_games",
        `fields uid,game.id,game.name,game.slug,game.summary,game.rating,game.cover.url,game.genres.name,game.themes.name,game.involved_companies.company.name,game.involved_companies.developer,game.involved_companies.publisher; where uid = (${uidList}) & category = ${category}; limit ${batch.length};`
      );

      const igdbMap = new Map(igdbResults.map((r) => [String(r.uid), r]));

      // Persist all results in parallel — one upsert per game, batched.
      await Promise.all(
        batch.map(async (uid) => {
          const match = igdbMap.get(uid);
          const canonicalGameId = match?.game?.id ? `igdb:${match.game.id}` : null;
          const metadata = match?.game ? igdbGameToDto(match.game) : null;

          await prisma.gameExternalSource.upsert({
            where: { provider_externalGameId: { provider: providerKey, externalGameId: uid } },
            create: {
              provider: providerKey,
              externalGameId: uid,
              externalTitle: match?.game?.name ?? null,
              canonicalGameId: canonicalGameId ?? "",
              confidence: "high",
              status: canonicalGameId ? "matched" : "unmatched",
              ...(metadata && { metadata }),
            },
            update: {
              externalTitle: match?.game?.name ?? null,
              canonicalGameId: canonicalGameId ?? "",
              status: canonicalGameId ? "matched" : "unmatched",
              ...(metadata && { metadata }),
            },
          });

          result.set(uid, canonicalGameId);
        })
      );
    }
  } catch {
    for (const uid of misses) {
      if (!result.has(uid)) result.set(uid, null);
    }
  }

  return result;
}

/**
 * Single-game IGDB lookup — delegates to batchMatchToIgdb.
 * Kept for backward compat; prefer batchMatchToIgdb in sync routes.
 */
export async function matchToIgdb(platform, externalId) {
  const map = await batchMatchToIgdb(platform, [String(externalId)]);
  return map.get(String(externalId)) ?? null;
}

/**
 * Batch-fetch IGDB game metadata for a list of igdb:* canonical IDs.
 *
 * Checks GameExternalSource.metadata DB cache first — avoids IGDB API calls
 * for any game already matched and cached by a previous sync.
 * Only calls IGDB for IDs with no cached metadata.
 *
 * Returns Map<canonicalId, gameDto>.
 */
export async function fetchIgdbGamesBatch(canonicalIds) {
  if (!canonicalIds.length) return new Map();

  const igdbIds = canonicalIds.filter((id) => typeof id === "string" && id.startsWith("igdb:"));
  if (!igdbIds.length) return new Map();

  // 1. DB metadata cache — populated by batchMatchToIgdb during sync.
  const dbRows = await prisma.gameExternalSource.findMany({
    where: { canonicalGameId: { in: igdbIds }, status: "matched" },
    select: { canonicalGameId: true, metadata: true },
  }).catch(() => []);

  const map = new Map();
  for (const row of dbRows) {
    if (!map.has(row.canonicalGameId) && row.metadata) {
      map.set(row.canonicalGameId, row.metadata);
    }
  }

  const uncached = igdbIds.filter((id) => !map.has(id));
  if (!uncached.length || !hasIgdbCredentials()) return map;

  // 2. IGDB API fallback for IDs not yet in metadata cache.
  const numericIds = uncached.map((id) => id.slice(5));
  try {
    const results = await igdbQuery(
      "games",
      `fields id,name,slug,summary,rating,cover.url,genres.name,themes.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher; where id = (${numericIds.join(",")}); limit ${numericIds.length};`
    );
    for (const g of results) {
      map.set(`igdb:${g.id}`, igdbGameToDto(g));
    }
  } catch {
    // IGDB unavailable — return what's in cache
  }

  return map;
}
