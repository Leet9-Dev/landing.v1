import { MOCK_STATS_SUMMARY } from "@/lib/mock/statsSummary";
import { MOCK_GAMES } from "@/lib/mock/games";
import { MOCK_PLATFORM_ACCOUNTS } from "@/lib/mock/platformAccounts";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  // Join top games by hours with canonical game data (title/studio/platforms).
  const topGamesByHours = MOCK_STATS_SUMMARY.topGamesByHours.map((t) => {
    const game = MOCK_GAMES.find((g) => g.id === t.gameId);
    return {
      ...t,
      gameTitle: game?.canonicalTitle ?? "Unknown Game",
      studio: game?.studio ?? null,
      sourcePlatforms: game?.sourcePlatforms ?? [],
      coverGradient: game?.coverGradient ?? null,
    };
  });

  // Resolve the highest-mastery game title for the mastery summary.
  const masteryHighest = MOCK_GAMES.find(
    (g) => g.id === MOCK_STATS_SUMMARY.mastery.highestGameId
  );
  // Resolve the most-active momentum game title.
  const momentumGame = MOCK_GAMES.find(
    (g) => g.id === MOCK_STATS_SUMMARY.momentum.mostActiveGameId
  );

  // Surface per-platform confidence alongside the platform split.
  const platformSplit = MOCK_STATS_SUMMARY.platformSplit.map((p) => {
    const account = MOCK_PLATFORM_ACCOUNTS.find((a) => a.provider === p.provider);
    return {
      ...p,
      status: account?.status ?? "not_connected",
      confidence: account?.confidence ?? "Incomplete",
      lastSyncAt: account?.lastSyncAt ?? null,
      summary: account?.summary ?? null,
    };
  });

  const data = {
    ...MOCK_STATS_SUMMARY,
    platformSplit,
    topGamesByHours,
    mastery: {
      ...MOCK_STATS_SUMMARY.mastery,
      highestGameTitle: masteryHighest?.canonicalTitle ?? null,
    },
    momentum: {
      ...MOCK_STATS_SUMMARY.momentum,
      mostActiveGameTitle: momentumGame?.canonicalTitle ?? null,
    },
  };

  return apiOk(data);
}
