import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { computeL9Points } from "@/lib/scoring/l9Points";
import { MOCK_GAMES } from "@/lib/mock/games";

const GAME_BY_ID = new Map(MOCK_GAMES.map((g) => [g.id, g]));

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const userGames = await prisma.userGame.findMany({ where: { userId } });

  if (userGames.length === 0) {
    return apiOk({
      totalL9Points: null,
      totalHoursPlayed: null,
      totalGames: null,
      totalAchievements: null,
      platformSplit: [],
      topGamesByHours: [],
      mastery: null,
      momentum: null,
      rarityBreakdown: [],
      pointsBreakdown: [],
      gamerDna: null,
    });
  }

  // Aggregates
  let totalHoursPlayed = 0;
  let totalAchievements = 0;
  const platformCounts = {};

  for (const ug of userGames) {
    totalHoursPlayed += ug.playtimeHours ?? 0;
    totalAchievements += ug.achievementsUnlocked ?? 0;
    const p = ug.sourceProvider || "unknown";
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  }

  totalHoursPlayed = Math.round(totalHoursPlayed * 10) / 10;
  const totalGames = userGames.length;
  const totalL9Points = computeL9Points({ playtimeHours: totalHoursPlayed, achievementsUnlocked: totalAchievements });

  // Platform split as %
  const platformSplit = Object.entries(platformCounts).map(([provider, count]) => ({
    provider,
    count,
    pct: Math.round((count / totalGames) * 100),
  }));

  // Top 5 games by hours, joined with catalogue
  const topGamesByHours = userGames
    .slice()
    .sort((a, b) => (b.playtimeHours ?? 0) - (a.playtimeHours ?? 0))
    .slice(0, 5)
    .map((ug) => {
      const meta = GAME_BY_ID.get(ug.canonicalGameId);
      const hours = Math.round((ug.playtimeHours ?? 0) * 10) / 10;
      const pts = computeL9Points({ playtimeHours: ug.playtimeHours, achievementsUnlocked: ug.achievementsUnlocked });
      return {
        canonicalGameId: ug.canonicalGameId,
        title: meta?.canonicalTitle ?? ug.canonicalGameId,
        coverGradient: meta?.coverGradient ?? null,
        hoursPlayed: hours,
        l9Points: pts,
        sourceProvider: ug.sourceProvider,
      };
    });

  return apiOk({
    totalL9Points,
    totalHoursPlayed,
    totalGames,
    totalAchievements,
    platformSplit,
    topGamesByHours,
    mastery: null,
    momentum: null,
    rarityBreakdown: [],
    pointsBreakdown: [],
    gamerDna: null,
  });
}
