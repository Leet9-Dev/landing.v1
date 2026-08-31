import { requireSession } from "@/lib/api/auth";
import { apiOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { MOCK_GAMES } from "@/lib/mock/games";
import { computeL9Points } from "@/lib/scoring/l9Points";
import { fetchIgdbGamesBatch } from "@/lib/integrations/igdb/igdbMatcher";

const GAME_BY_ID = new Map(MOCK_GAMES.map((g) => [g.id, g]));

export async function GET(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const source = searchParams.get("source") || "";
  const sort = searchParams.get("sort") || "lastPlayed";

  // 1. Fetch real UserGame rows from DB.
  const userGames = await prisma.userGame.findMany({
    where: { userId },
  });

  if (userGames.length === 0) {
    return apiOk({ games: [], total: 0 });
  }

  // 2. Pull lastPlayedAt from PlatformDetectedGame — more accurate than lastDetectedAt.
  const canonicalIds = userGames.map((ug) => ug.canonicalGameId).filter(Boolean);
  const platformAccounts = await prisma.platformAccount.findMany({
    where: { userId },
    select: { id: true },
  });
  const platformAccountIds = platformAccounts.map((a) => a.id);

  const detectedGames = platformAccountIds.length > 0
    ? await prisma.platformDetectedGame.findMany({
        where: {
          platformAccountId: { in: platformAccountIds },
          canonicalGameId: { in: canonicalIds },
        },
        select: { canonicalGameId: true, lastPlayedAt: true },
      })
    : [];

  // Only show games that were actually detected from a connected platform ID.
  const detectedGameIds = new Set(detectedGames.map((dg) => dg.canonicalGameId));

  // Build map: canonicalGameId → most recent lastPlayedAt across all platform accounts.
  const lastPlayedMap = new Map();
  for (const dg of detectedGames) {
    if (!dg.lastPlayedAt) continue;
    const existing = lastPlayedMap.get(dg.canonicalGameId);
    if (!existing || dg.lastPlayedAt > existing) {
      lastPlayedMap.set(dg.canonicalGameId, dg.lastPlayedAt);
    }
  }

  // 3. Resolve game metadata: MOCK_GAMES for legacy IDs, IGDB for igdb:* IDs.
  const igdbIds = canonicalIds.filter((id) => id?.startsWith("igdb:"));
  const igdbGameMap = await fetchIgdbGamesBatch(igdbIds);

  let games = userGames
    .map((ug) => {
      const game = GAME_BY_ID.get(ug.canonicalGameId) ?? igdbGameMap.get(ug.canonicalGameId) ?? null;
      if (!game) return null;
      return {
        gameId: ug.canonicalGameId,
        inLibrary: true,
        inProfile: true,
        sourcePlatforms: ug.sourceProvider ? [ug.sourceProvider] : [],
        l9Points: computeL9Points({ playtimeHours: ug.playtimeHours, achievementsUnlocked: ug.achievementsUnlocked }),
        hoursPlayed: ug.playtimeHours ?? 0,
        achievementsUnlocked: ug.achievementsUnlocked ?? null,
        trophiesUnlocked: ug.trophiesUnlocked ?? null,
        achievementsTotal: null,
        masteryPct: null,
        lastPlayedAt: lastPlayedMap.get(ug.canonicalGameId) ?? ug.lastDetectedAt ?? null,
        game,
      };
    })
    .filter(Boolean);

  // 4. Filters — only games detected from a connected platform ID.
  games = games.filter((ug) => detectedGameIds.has(ug.gameId));
  if (q) {
    games = games.filter((ug) => ug.game.canonicalTitle.toLowerCase().includes(q));
  }
  if (source) {
    games = games.filter((ug) => ug.sourcePlatforms.includes(source));
  }

  // 5. Include unmatched detected games from connected platforms (no canonical match yet).
  // These appear as plain cards with just the platform title.
  const matchedCanonicalIds = new Set(games.map((g) => g.gameId));
  const unmatchedDetected = platformAccountIds.length > 0
    ? await prisma.platformDetectedGame.findMany({
        where: {
          platformAccountId: { in: platformAccountIds },
          canonicalGameId: null,
        },
        select: {
          externalGameId: true,
          externalTitle: true,
          provider: true,
          lastPlayedAt: true,
          normalized: true,
        },
        orderBy: { lastPlayedAt: "desc" },
      }).catch(() => [])
    : [];

  const seenUnmatched = new Set();
  const unmatchedGames = unmatchedDetected
    .filter((dg) => {
      const key = `${dg.provider}:${dg.externalGameId}`;
      if (seenUnmatched.has(key)) return false;
      seenUnmatched.add(key);
      if (q && !dg.externalTitle.toLowerCase().includes(q)) return false;
      if (source && dg.provider !== source) return false;
      return true;
    })
    .map((dg) => ({
      gameId: `${dg.provider}:${dg.externalGameId}`,
      inLibrary: false,
      inProfile: true,
      unmatched: true,
      sourcePlatforms: [dg.provider],
      l9Points: null,
      hoursPlayed: 0,
      achievementsUnlocked: null,
      trophiesUnlocked: dg.normalized?.trophiesUnlocked ?? null,
      achievementsTotal: null,
      masteryPct: null,
      lastPlayedAt: dg.lastPlayedAt ?? null,
      game: {
        canonicalTitle: dg.externalTitle,
        coverImageUrl: null,
        coverGradient: "#12141E",
      },
    }));

  const allGames = [...games, ...unmatchedGames];

  // 6. Sort
  if (sort === "l9Points") {
    allGames.sort((a, b) => (b.l9Points ?? 0) - (a.l9Points ?? 0));
  } else if (sort === "hoursPlayed" || sort === "mastery") {
    allGames.sort((a, b) => (b.hoursPlayed ?? 0) - (a.hoursPlayed ?? 0));
  } else {
    allGames.sort((a, b) => {
      const aTime = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
      const bTime = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  return apiOk({ games: allGames, total: allGames.length });
}
