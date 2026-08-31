import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { computeL9Points } from "@/lib/scoring/l9Points";
import { MOCK_GAMES } from "@/lib/mock/games";
import { fetchIgdbGamesBatch } from "@/lib/integrations/igdb/igdbMatcher";

const GAME_BY_ID = new Map(MOCK_GAMES.map((g) => [g.id, g]));

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [userGames, ledgerAgg, xpAgg, recentLedger] = await Promise.all([
    prisma.userGame.findMany({ where: { userId } }),
    prisma.pointsLedger.aggregate({ where: { userId }, _sum: { points: true } }),
    prisma.xpLedger.aggregate({ where: { userId }, _sum: { xpDelta: true } }).catch(() => ({ _sum: { xpDelta: null } })),
    prisma.pointsLedger.findMany({
      where: { userId, awardedAt: { gte: sixMonthsAgo } },
      select: { points: true, awardedAt: true },
    }),
  ]);

  const xpFromV2 = xpAgg._sum.xpDelta ?? 0;
  const xpFromV1 = ledgerAgg._sum.points ?? 0;
  const totalL9Points = xpFromV2 > 0 ? xpFromV2 : xpFromV1;

  // Monthly points breakdown (last 6 months).
  const byMonth = {};
  for (const row of recentLedger) {
    const month = row.awardedAt.toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + row.points;
  }

  const monthly = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly.push({ month, l9Points: byMonth[month] || 0 });
  }

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const pointsThisMonth = byMonth[thisMonthKey] || 0;
  const pointsLastMonth = byMonth[lastMonthKey] || 0;
  const momChangePct = pointsLastMonth === 0
    ? (pointsThisMonth > 0 ? 100 : 0)
    : Math.round(((pointsThisMonth - pointsLastMonth) / pointsLastMonth) * 1000) / 10;

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRows = recentLedger.filter((r) => r.awardedAt >= thisMonthStart);
  const activeWeeks = new Set(
    thisMonthRows.map((r) => `${r.awardedAt.getFullYear()}-W${Math.ceil(r.awardedAt.getDate() / 7)}`)
  );

  if (userGames.length === 0) {
    const momentum = totalL9Points > 0 ? {
      pointsThisMonth,
      pointsLastMonth,
      momChangePct,
      mostActiveGameTitle: null,
      hoursThisMonth: 0,
      achievementsThisMonth: 0,
      activeWeeksStreak: activeWeeks.size,
    } : null;

    return apiOk({
      totalL9Points,
      totalHoursPlayed: null,
      totalGames: null,
      totalAchievements: null,
      platformSplit: [],
      topGamesByHours: [],
      mastery: null,
      momentum,
      monthly,
      rarityBreakdown: [],
      pointsBreakdown: [],
      gamerDna: null,
    });
  }

  // Aggregates
  let totalHoursPlayed = 0;
  let totalAchievements = 0;
  let totalTrophies = 0;
  const platformCounts = {};

  for (const ug of userGames) {
    totalHoursPlayed += ug.playtimeHours ?? 0;
    totalAchievements += ug.achievementsUnlocked ?? 0;
    totalTrophies += ug.trophiesUnlocked ?? 0;
    const p = ug.sourceProvider || "unknown";
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  }

  totalHoursPlayed = Math.round(totalHoursPlayed * 10) / 10;
  const totalGames = userGames.length;

  // Platform split as %
  const platformSplit = Object.entries(platformCounts).map(([provider, count]) => ({
    provider,
    count,
    pct: Math.round((count / totalGames) * 100),
  }));

  // Top 5 games by hours, joined with catalogue (MOCK_GAMES + IGDB).
  const top5 = userGames
    .slice()
    .sort((a, b) => (b.playtimeHours ?? 0) - (a.playtimeHours ?? 0))
    .slice(0, 5);

  const igdbIds = top5.map((ug) => ug.canonicalGameId).filter((id) => id?.startsWith("igdb:"));
  const igdbMetaMap = await fetchIgdbGamesBatch(igdbIds);

  const topGamesByHours = top5.map((ug) => {
    const meta = GAME_BY_ID.get(ug.canonicalGameId) ?? igdbMetaMap.get(ug.canonicalGameId) ?? null;
    const hours = Math.round((ug.playtimeHours ?? 0) * 10) / 10;
    const pts = computeL9Points({ playtimeHours: ug.playtimeHours, achievementsUnlocked: ug.achievementsUnlocked });
    return {
      canonicalGameId: ug.canonicalGameId,
      title: meta?.canonicalTitle ?? ug.canonicalGameId,
      coverImageUrl: meta?.coverImageUrl ?? null,
      coverGradient: meta?.coverGradient ?? null,
      hoursPlayed: hours,
      l9Points: pts,
      sourceProvider: ug.sourceProvider,
    };
  });

  const momentum = totalL9Points > 0 ? {
    pointsThisMonth,
    pointsLastMonth,
    momChangePct,
    mostActiveGameTitle: topGamesByHours[0]?.title ?? null,
    hoursThisMonth: totalHoursPlayed,
    achievementsThisMonth: totalAchievements,
    activeWeeksStreak: activeWeeks.size,
  } : null;

  return apiOk({
    totalL9Points,
    totalHoursPlayed,
    totalGames,
    totalAchievements,
    totalTrophies,
    platformSplit,
    topGamesByHours,
    mastery: null,
    momentum,
    monthly,
    rarityBreakdown: [],
    pointsBreakdown: [],
    gamerDna: null,
  });
}
