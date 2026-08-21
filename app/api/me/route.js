import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { PLATFORM_ACCOUNT_STATUS } from "@/lib/platforms/platforms";
import { computeLevel, computeRankInfo } from "@/lib/scoring/l9Points";

const GAME_PLATFORMS = ["steam", "psn", "xbox", "epic"];

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const realName = session.user.name || "Gamer";

  const [platformRows, ledgerAgg, xpAgg, gamesCount] = await Promise.all([
    prisma.platformAccount.findMany({
      where: { userId, status: PLATFORM_ACCOUNT_STATUS.CONNECTED },
    }),
    prisma.pointsLedger.aggregate({ where: { userId }, _sum: { points: true } }),
    prisma.xpLedger.aggregate({ where: { userId }, _sum: { xpDelta: true } }).catch(() => ({ _sum: { xpDelta: null } })),
    prisma.userGame.count({ where: { userId } }),
  ]);

  const platformsConnected = platformRows
    .map((r) => r.provider)
    .filter((p) => GAME_PLATFORMS.includes(p));

  const xpFromV2 = xpAgg._sum.xpDelta ?? 0;
  const xpFromV1 = ledgerAgg._sum.points ?? 0;
  const l9Points = xpFromV2 > 0 ? xpFromV2 : xpFromV1;
  const level = computeLevel(l9Points);
  const rankInfo = computeRankInfo(l9Points);

  return apiOk({
    id: userId,
    gamerTag: realName,
    displayName: realName,
    avatarUrl: session.user.image || null,
    avatarInitials: realName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    level,
    l9Points,
    rankTier: rankInfo.rankTier,
    nextRank: rankInfo.nextRank,
    rankProgressPct: rankInfo.rankProgressPct,
    pointsToNextRank: rankInfo.pointsToNextRank,
    tribeId: null,
    tribeTag: null,
    archetype: null,
    profileCompletenessPct: null,
    platformsConnected,
    gamesCount,
  });
}
