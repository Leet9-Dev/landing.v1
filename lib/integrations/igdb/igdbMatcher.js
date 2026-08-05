// IGDB canonical game matcher.
//
// Maps detected (platform, externalId) pairs to IGDB game IDs.
// Results are cached in the GameExternalSource DB table so each external ID
// is only looked up once across the lifetime of the DB.
//
// Supported platforms (IGDB external_games categories):
//   steam   → category 1  (uid = Steam App ID string, e.g. "730")
//   gog     → category 17 (uid = GOG product ID)
//   epic    → category 26 (uid = Epic slug/ID)
//   xbox    → category 11 (uid = Xbox title ID)
//
// PSN trophy title IDs (NPWR* format) do not map cleanly to IGDB external_games
// UIDs, so PSN is not included here — PSN relies on MOCK_EXTERNAL_SOURCES only.

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
  return url.replace("//images.igdb.com", "//images.igdb.com").replace("t_thumb", "t_cover_big").replace(/^http:/, "https:");
}

/**
 * Shape a raw IGDB game object into the internal game DTO format.
 * Compatible with MOCK_GAMES structure so both can be served by the same routes.
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
 * Resolve (platform, externalId) → canonical game ID string ("igdb:{igdbId}").
 *
 * Flow:
 *   1. If platform not in IGDB_CATEGORY or no credentials → return null.
 *   2. Check GameExternalSource DB cache (null = previously confirmed unmatched).
 *   3. Query IGDB external_games API.
 *   4. Upsert result into GameExternalSource cache.
 *   5. Return canonical ID or null.
 *
 * Never throws — returns null on any IGDB error so callers can fall through to
 * MOCK_EXTERNAL_SOURCES or mark the game as unmatched.
 */
export async function matchToIgdb(platform, externalId) {
  const category = IGDB_CATEGORY[platform];
  if (!category || !hasIgdbCredentials()) return null;

  const uid = String(externalId);

  const cached = await prisma.gameExternalSource.findUnique({
    where: { provider_externalGameId: { provider: `igdb_${platform}`, externalGameId: uid } },
  });
  if (cached) return cached.canonicalGameId || null;

  try {
    const results = await igdbQuery(
      "external_games",
      `fields uid,game.id,game.name; where uid = "${uid}" & category = ${category}; limit 1;`
    );

    const match = results?.[0];
    const canonicalGameId = match?.game?.id ? `igdb:${match.game.id}` : null;

    await prisma.gameExternalSource.upsert({
      where: { provider_externalGameId: { provider: `igdb_${platform}`, externalGameId: uid } },
      create: {
        provider: `igdb_${platform}`,
        externalGameId: uid,
        externalTitle: match?.game?.name ?? null,
        canonicalGameId: canonicalGameId ?? "",
        confidence: "high",
        status: canonicalGameId ? "matched" : "unmatched",
      },
      update: {
        externalTitle: match?.game?.name ?? null,
        canonicalGameId: canonicalGameId ?? "",
        status: canonicalGameId ? "matched" : "unmatched",
      },
    });

    return canonicalGameId;
  } catch {
    return null;
  }
}

/**
 * Batch-fetch IGDB game metadata for a list of canonical IDs.
 * ids: string[] of "igdb:{number}" canonical game IDs.
 * Returns Map<canonicalId, gameDto>.
 * Returns empty map if credentials missing or IGDB unavailable.
 */
export async function fetchIgdbGamesBatch(canonicalIds) {
  if (!hasIgdbCredentials() || !canonicalIds.length) return new Map();

  const numericIds = canonicalIds
    .filter((id) => typeof id === "string" && id.startsWith("igdb:"))
    .map((id) => id.slice(5))
    .filter(Boolean);

  if (!numericIds.length) return new Map();

  try {
    const results = await igdbQuery(
      "games",
      `fields id,name,slug,summary,rating,cover.url,genres.name,themes.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher; where id = (${numericIds.join(",")}); limit ${numericIds.length};`
    );

    const map = new Map();
    for (const g of results) {
      map.set(`igdb:${g.id}`, igdbGameToDto(g));
    }
    return map;
  } catch {
    return new Map();
  }
}
