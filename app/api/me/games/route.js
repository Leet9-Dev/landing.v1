import { requireSession } from "@/lib/api/auth";
import { apiOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { MOCK_GAMES } from "@/lib/mock/games";
import { computeL9Points } from "@/lib/scoring/l9Points";

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

  // Build map: canonicalGameId → most recent lastPlayedAt across all platform accounts.
  const lastPlayedMap = new Map();
  for (const dg of detectedGames) {
    if (!dg.lastPlayedAt) continue;
    const existing = lastPlayedMap.get(dg.canonicalGameId);
    if (!existing || dg.lastPlayedAt > existing) {
      lastPlayedMap.set(dg.canonicalGameId, dg.lastPlayedAt);
    }
  }

  // 3. Shape results — join to MOCK_GAMES for title/cover until a real Game catalogue exists.
  let games = userGames
    .map((ug) => {
      const game = GAME_BY_ID.get(ug.canonicalGameId);
      if (!game) return null; // unmatched game has no catalogue entry yet
      return {
        gameId: ug.canonicalGameId,
        inLibrary: true,
        inProfile: true,
        sourcePlatforms: ug.sourceProvider ? [ug.sourceProvider] : [],
        l9Points: computeL9Points({ playtimeHours: ug.playtimeHours, achievementsUnlocked: ug.achievementsUnlocked }),
        hoursPlayed: ug.playtimeHours ?? 0,
        achievementsUnlocked: ug.achievementsUnlocked ?? null,
        achievementsTotal: null, // not tracked in DB or game catalogue yet
        masteryPct: null,     // computed from unlocked/total once both exist
        lastPlayedAt: lastPlayedMap.get(ug.canonicalGameId) ?? ug.lastDetectedAt ?? null,
        game,
      };
    })
    .filter(Boolean);

  // 4. Filters
  if (q) {
    games = games.filter((ug) => ug.game.canonicalTitle.toLowerCase().includes(q));
  }
  if (source) {
    games = games.filter((ug) => ug.sourcePlatforms.includes(source));
  }

  // 5. Sort
  if (sort === "l9Points") {
    games = games.sort((a, b) => (b.l9Points ?? 0) - (a.l9Points ?? 0));
  } else if (sort === "hoursPlayed" || sort === "mastery") {
    games = games.sort((a, b) => b.hoursPlayed - a.hoursPlayed);
  } else {
    // lastPlayed (default)
    games = games.sort((a, b) => {
      const aTime = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
      const bTime = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  return apiOk({ games, total: games.length });
}
