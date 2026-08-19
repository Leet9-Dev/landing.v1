import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// E7 Leaderboard — SeasonScore (SP) as primary, XpLedger lifetime as secondary.
// Supports ?type=season (default) and ?type=lifetime.
// ?limit=100 (default), max 200.

export const dynamic = "force-dynamic"; // never pre-render; requires DB at request time
export const revalidate = 0;

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const NEW_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function GET(request) {
  const session = await getServerSession(authOptions).catch(() => null);
  const { searchParams } = new URL(request.url);
  const type  = searchParams.get("type") ?? "season";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? DEFAULT_LIMIT, 10) || DEFAULT_LIMIT, MAX_LIMIT);

  let rows = [];
  let myRank = null;

  if (type === "season") {
    // Primary: SeasonScore ordered by spTotal for the active season.
    const activeSeason = await prisma.season
      .findFirst({ where: { isActive: true }, orderBy: { id: "desc" }, select: { id: true, name: true } })
      .catch(() => null);

    const seasonId = activeSeason?.id ?? 0;

    const scores = await prisma.seasonScore.findMany({
      where: { seasonId },
      orderBy: { spTotal: "desc" },
      take: limit,
      select: { userId: true, spTotal: true, tier: true },
    });

    if (scores.length > 0) {
      const userIds = scores.map((r) => r.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, image: true, createdAt: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      const now = Date.now();

      rows = scores
        .map((r, i) => {
          const u = userMap.get(r.userId);
          if (!u) return null;
          return {
            rank: i + 1,
            userId: u.id,
            name: u.name ?? "Gamer",
            image: u.image ?? null,
            l9Points: r.spTotal,
            tier: r.tier,
            isNew: now - new Date(u.createdAt).getTime() < NEW_THRESHOLD_MS,
            seasonId,
            seasonName: activeSeason?.name ?? "Preseason",
          };
        })
        .filter(Boolean);

      if (session?.user?.id) {
        const myRow = rows.find((r) => r.userId === session.user.id);
        if (myRow) {
          myRank = myRow.rank;
        } else {
          const myScore = await prisma.seasonScore.findUnique({
            where: { userId_seasonId: { userId: session.user.id, seasonId } },
            select: { spTotal: true },
          }).catch(() => null);
          if (myScore) {
            const aheadCount = await prisma.seasonScore.count({
              where: { seasonId, spTotal: { gt: myScore.spTotal } },
            });
            myRank = aheadCount + 1;
          }
        }
      }
    } else {
      // Fallback: no SeasonScore data yet — use PointsLedger (pre-E1 state)
      return await legacyLeaderboard(request, session, limit);
    }
  } else {
    // Lifetime leaderboard: XpLedger sum per user.
    const xpLedger = await prisma.xpLedger.groupBy({
      by: ["userId"],
      _sum: { xpDelta: true },
      orderBy: { _sum: { xpDelta: "desc" } },
      take: limit,
    }).catch(() => []);

    if (xpLedger.length > 0) {
      const userIds = xpLedger.map((r) => r.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, image: true, createdAt: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      const now = Date.now();

      rows = xpLedger
        .map((r, i) => {
          const u = userMap.get(r.userId);
          if (!u) return null;
          return {
            rank: i + 1,
            userId: u.id,
            name: u.name ?? "Gamer",
            image: u.image ?? null,
            l9Points: r._sum.xpDelta ?? 0,
            isNew: now - new Date(u.createdAt).getTime() < NEW_THRESHOLD_MS,
          };
        })
        .filter(Boolean);

      if (session?.user?.id) {
        const myRow = rows.find((r) => r.userId === session.user.id);
        if (myRow) {
          myRank = myRow.rank;
        } else {
          const myTotal = await prisma.xpLedger.aggregate({
            where: { userId: session.user.id },
            _sum: { xpDelta: true },
          }).catch(() => ({ _sum: { xpDelta: 0 } }));
          const myXp = myTotal._sum.xpDelta ?? 0;
          const aheadCount = await prisma.xpLedger.groupBy({
            by: ["userId"],
            _sum: { xpDelta: true },
            having: { xpDelta: { _sum: { gt: myXp } } },
          }).then((r) => r.length).catch(() => 0);
          myRank = aheadCount + 1;
        }
      }
    } else {
      return await legacyLeaderboard(request, session, limit);
    }
  }

  return apiOk({ rows, myRank, type });
}

// Legacy fallback using PointsLedger (pre-E1 deployments).
async function legacyLeaderboard(request, session, limit) {
  const ledger = await prisma.pointsLedger.groupBy({
    by: ["userId"],
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: limit,
  }).catch(() => []);

  if (!ledger.length) return apiOk({ rows: [], myRank: null, type: "legacy" });

  const userIds = ledger.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true, createdAt: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const now = Date.now();

  const rows = ledger
    .map((r, i) => {
      const u = userMap.get(r.userId);
      if (!u) return null;
      return {
        rank: i + 1,
        userId: u.id,
        name: u.name ?? "Gamer",
        image: u.image ?? null,
        l9Points: r._sum.points ?? 0,
        isNew: now - new Date(u.createdAt).getTime() < NEW_THRESHOLD_MS,
      };
    })
    .filter(Boolean);

  let myRank = null;
  if (session?.user?.id) {
    const myRow = rows.find((r) => r.userId === session.user.id);
    myRank = myRow?.rank ?? null;
  }

  return apiOk({ rows, myRank, type: "legacy" });
}
