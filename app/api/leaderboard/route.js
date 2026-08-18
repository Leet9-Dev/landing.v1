import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 300; // cache 5 min

export async function GET() {
  const session = await getServerSession(authOptions).catch(() => null);

  // Aggregate total points per user
  const ledger = await prisma.pointsLedger.groupBy({
    by: ["userId"],
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: 100,
  });

  if (!ledger.length) return apiOk({ rows: [], myRank: null });

  const userIds = ledger.map((r) => r.userId);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true, createdAt: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));
  const now = Date.now();
  const NEW_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

  const rows = ledger
    .map((r, i) => {
      const u = userMap.get(r.userId);
      if (!u) return null;
      const isNew = now - new Date(u.createdAt).getTime() < NEW_THRESHOLD_MS;
      return {
        rank: i + 1,
        userId: u.id,
        name: u.name ?? "Gamer",
        image: u.image ?? null,
        l9Points: r._sum.points ?? 0,
        isNew,
      };
    })
    .filter(Boolean);

  // Find current user's rank
  let myRank = null;
  if (session?.user?.id) {
    const myRow = rows.find((r) => r.userId === session.user.id);
    if (myRow) {
      myRank = myRow.rank;
    } else {
      // user exists but outside top 100 — compute their rank
      const above = await prisma.pointsLedger.groupBy({
        by: ["userId"],
        _sum: { points: true },
        having: { points: { _sum: { gt: 0 } } },
      });
      // count users with more points than current user
      const myTotal = await prisma.pointsLedger.aggregate({
        where: { userId: session.user.id },
        _sum: { points: true },
      });
      const myPoints = myTotal._sum.points ?? 0;
      const ahead = above.filter((r) => (r._sum.points ?? 0) > myPoints).length;
      myRank = ahead + 1;
    }
  }

  return apiOk({ rows, myRank });
}
