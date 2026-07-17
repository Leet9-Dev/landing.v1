import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { PLATFORM_ACCOUNT_STATUS } from "@/lib/platforms/platforms";

const GAME_PLATFORMS = ["steam", "psn", "xbox", "epic"];

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const realName = session.user.name || "Gamer";

  // Real platform accounts from DB
  const platformRows = await prisma.platformAccount.findMany({
    where: { userId, status: PLATFORM_ACCOUNT_STATUS.CONNECTED },
  });
  const platformsConnected = platformRows
    .map((r) => r.provider)
    .filter((p) => GAME_PLATFORMS.includes(p));

  const user = {
    id: userId,
    gamerTag: realName,
    displayName: realName,
    avatarUrl: session.user.image || null,
    avatarInitials: realName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    location: null,
    level: null,
    l9Points: null,
    rankTier: null,
    nextRank: null,
    rankProgressPct: null,
    pointsToNextRank: null,
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
