import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { computeLevel, computeRankInfo } from "@/lib/scoring/l9Points";
import { MOCK_GAMES } from "@/lib/mock/games";

const MOCK_GAMES_MAP = Object.fromEntries(MOCK_GAMES.map((g) => [g.id, g]));

export async function GET(request, { params }) {
  const { userId } = await params;
  if (!userId) return apiError("MISSING_ID", "User ID required.", 400);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true, bio: true, location: true, createdAt: true },
  });

  if (!user) return apiError("NOT_FOUND", "User not found.", 404);

  const [ledgerAgg, gameRows, platformRows] = await Promise.all([
    prisma.pointsLedger.aggregate({ where: { userId }, _sum: { points: true } }),
    prisma.userGame.findMany({
      where: { userId },
      select: {
        canonicalGameId: true,
        playtimeHours: true,
        achievementsUnlocked: true,
        trophiesUnlocked: true,
        sourceProvider: true,
      },
    }),
    prisma.platformAccount.findMany({
      where: { userId, status: "connected" },
      select: { provider: true },
    }),
  ]);

  const l9Points = ledgerAgg._sum.points ?? 0;
  const level = computeLevel(l9Points);
  const rankInfo = computeRankInfo(l9Points);

  const GAME_PLATFORMS = ["steam", "psn", "xbox", "epic"];
  const platforms = [...new Set(
    platformRows.map((r) => r.provider).filter((p) => GAME_PLATFORMS.includes(p))
  )];

  const totalHours = gameRows.reduce((s, g) => s + (g.playtimeHours ?? 0), 0);
  const totalAchievements = gameRows.reduce((s, g) => s + (g.achievementsUnlocked ?? 0), 0);
  const gamesCount = gameRows.length;
  const name = user.name || "Gamer";

  const games = gameRows.map((g) => {
    const meta = MOCK_GAMES_MAP[g.canonicalGameId];
    return {
      id: g.canonicalGameId,
      title: meta?.canonicalTitle ?? g.canonicalGameId,
      studio: meta?.studio ?? null,
      coverImageUrl: meta?.coverImageUrl || null,
      coverGradient: meta?.coverGradient ?? null,
      playtimeHours: g.playtimeHours ? Math.round(g.playtimeHours) : null,
      achievementsUnlocked: g.achievementsUnlocked ?? null,
      trophiesUnlocked: g.trophiesUnlocked ?? null,
      sourceProvider: g.sourceProvider ?? null,
    };
  });

  return apiOk({
    user: {
      id: user.id,
      gamerTag: name,
      avatarUrl: user.image ?? null,
      avatarInitials: name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      bio: user.bio ?? null,
      location: user.location ?? null,
      l9Points,
      level,
      rankTier: rankInfo.rankTier,
      nextRank: rankInfo.nextRank,
      rankProgressPct: rankInfo.rankProgressPct,
      pointsToNextRank: rankInfo.pointsToNextRank,
      platforms,
      gamesCount,
      totalHours: Math.round(totalHours),
      totalAchievements,
      games,
    },
  });
}
