import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const [user, userGames, platformAccounts, follows, reviews, badges, pointsLedger] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, createdAt: true },
    }),
    prisma.userGame.findMany({ where: { userId } }),
    prisma.platformAccount.findMany({
      where: { userId },
      select: { provider: true, externalUserId: true, status: true, lastSyncAt: true, createdAt: true },
    }),
    prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true, createdAt: true },
    }),
    prisma.gameReview.findMany({
      where: { userId },
      select: { gameId: true, rating: true, content: true, createdAt: true },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { brandedName: true, tier: true, unlockedAt: true },
    }),
    prisma.pointsLedger.findMany({
      where: { userId },
      select: { points: true, note: true, createdAt: true },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: user,
    games: userGames,
    platforms: platformAccounts,
    follows,
    reviews,
    badges,
    pointsHistory: pointsLedger,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="leet9-data-${userId}-${Date.now()}.json"`,
    },
  });
}
