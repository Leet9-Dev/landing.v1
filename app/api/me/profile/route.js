import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { PLATFORM_ACCOUNT_STATUS } from "@/lib/platforms/platforms";
import { computeL9Points, computeLevel, computeRankInfo } from "@/lib/scoring/l9Points";

const GAME_PLATFORMS = ["steam", "psn", "xbox", "epic"];

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const realName = session.user.name || "Gamer";

  const [platformRows, userGames] = await Promise.all([
    prisma.platformAccount.findMany({
      where: { userId, status: PLATFORM_ACCOUNT_STATUS.CONNECTED },
    }),
    prisma.userGame.findMany({
      where: { userId },
      select: { playtimeHours: true, achievementsUnlocked: true },
    }),
  ]);

  const platformsConnected = platformRows
    .map((r) => r.provider)
    .filter((p) => GAME_PLATFORMS.includes(p));

  // Compute scoring from real data if available
  let level = null;
  let l9Points = null;
  let rankTier = null;
  let nextRank = null;
  let rankProgressPct = null;
  let pointsToNextRank = null;

  if (userGames.length > 0) {
    const totalHours = userGames.reduce((sum, ug) => sum + (ug.playtimeHours ?? 0), 0);
    const totalAch = userGames.reduce((sum, ug) => sum + (ug.achievementsUnlocked ?? 0), 0);
    l9Points = computeL9Points({ playtimeHours: totalHours, achievementsUnlocked: totalAch });
    level = computeLevel(l9Points);
    const rankInfo = computeRankInfo(l9Points);
    rankTier = rankInfo.rankTier;
    nextRank = rankInfo.nextRank;
    rankProgressPct = rankInfo.rankProgressPct;
    pointsToNextRank = rankInfo.pointsToNextRank;
  }

  const user = {
    id: userId,
    gamerTag: realName,
    displayName: realName,
    avatarUrl: session.user.image || null,
    avatarInitials: realName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    location: null,
    level,
    l9Points,
    rankTier,
    nextRank,
    rankProgressPct,
    pointsToNextRank,
    globalPercentile: null,
    tribeId: null,
    tribeTag: null,
    archetype: null,
    profileCompletenessPct: null,
    platformsConnected,
  };

  return apiOk({
    user,
    signatureGames: [],
    trophyCase: [],
    friendsComparison: [],
    recentActivity: [],
  });
}
