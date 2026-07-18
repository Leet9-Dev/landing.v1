import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { MOCK_GAMES } from "@/lib/mock/games";

const GAME_BY_ID = new Map(MOCK_GAMES.map((g) => [g.id, g]));

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  // Fetch completed execute syncs for this user (sync_completed events).
  const syncRuns = await prisma.platformSyncRun.findMany({
    where: {
      platformAccount: { userId },
      mode: "execute",
      status: "success",
    },
    select: {
      id: true,
      provider: true,
      finishedAt: true,
      rawGamesDetected: true,
      matchedCanonicalGames: true,
      userGamesToCreate: true,
      userGamesToUpdate: true,
    },
    orderBy: { finishedAt: "desc" },
    take: 20,
  });

  // Fetch recently added games for this user (game_added events).
  const recentGames = await prisma.userGame.findMany({
    where: { userId, firstDetectedAt: { not: null } },
    select: {
      canonicalGameId: true,
      firstDetectedAt: true,
      sourceProvider: true,
      playtimeHours: true,
    },
    orderBy: { firstDetectedAt: "desc" },
    take: 20,
  });

  // Build activity events from sync runs.
  const syncEvents = syncRuns
    .filter((r) => r.finishedAt)
    .map((r) => ({
      type: "sync_completed",
      provider: r.provider,
      timestamp: r.finishedAt.toISOString(),
      data: {
        rawGamesDetected: r.rawGamesDetected,
        matchedCanonicalGames: r.matchedCanonicalGames,
        gamesAdded: r.userGamesToCreate,
        gamesUpdated: r.userGamesToUpdate,
      },
    }));

  // Build activity events from newly added games.
  const gameEvents = recentGames
    .filter((ug) => ug.firstDetectedAt)
    .map((ug) => {
      const meta = GAME_BY_ID.get(ug.canonicalGameId);
      return {
        type: "game_added",
        provider: ug.sourceProvider ?? "unknown",
        timestamp: ug.firstDetectedAt.toISOString(),
        data: {
          canonicalGameId: ug.canonicalGameId,
          title: meta?.canonicalTitle ?? ug.canonicalGameId,
          coverGradient: meta?.coverGradient ?? null,
          hoursPlayed: Math.round((ug.playtimeHours ?? 0) * 10) / 10,
        },
      };
    });

  // Merge, sort by timestamp desc, take top 20.
  const activity = [...syncEvents, ...gameEvents]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);

  return apiOk({ activity });
}
