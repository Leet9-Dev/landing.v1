import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { computeLevel } from "@/lib/scoring/l9Points";

export async function GET(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const scope = new URL(request.url).searchParams.get("scope") || "global";

  // For friends scope, load followed user IDs first.
  let friendIds = null;
  if (scope === "friends") {
    const followRows = await prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    friendIds = new Set(followRows.map((r) => r.followingId));
    friendIds.add(userId);
  }

  // Aggregate real L9 Points from PointsLedger (source of truth).
  const ledgerRows = await prisma.pointsLedger.groupBy({
    by: ["userId"],
    _sum: { points: true },
  });

  if (ledgerRows.length === 0) {
    return apiOk({ rankings: [], currentUserRank: null });
  }

  // Build scored list sorted by total points.
  let scored = ledgerRows
    .map((row) => ({ userId: row.userId, l9Points: row._sum.points ?? 0 }))
    .sort((a, b) => b.l9Points - a.l9Points);

  // Find global rank before filtering (used for currentUserRank).
  const globalIndex = scored.findIndex((r) => r.userId === userId);

  // Apply friends scope filter.
  if (friendIds) {
    scored = scored.filter((r) => friendIds.has(r.userId));
  }

  // Fetch game stats per user for display columns.
  const allGameRows = await prisma.userGame.findMany({
    select: { userId: true, playtimeHours: true, achievementsUnlocked: true, sourceProvider: true },
  });
  const gamesByUser = {};
  for (const row of allGameRows) {
    if (!gamesByUser[row.userId]) {
      gamesByUser[row.userId] = { totalHours: 0, totalAchievements: 0, gamesCount: 0, platforms: new Set() };
    }
    gamesByUser[row.userId].totalHours += row.playtimeHours ?? 0;
    gamesByUser[row.userId].totalAchievements += row.achievementsUnlocked ?? 0;
    gamesByUser[row.userId].gamesCount += 1;
    if (row.sourceProvider) gamesByUser[row.userId].platforms.add(row.sourceProvider);
  }

  // Fetch user display info for top 100.
  const top100 = scored.slice(0, 100);
  const userIds = top100.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const rankings = top100.map((row, i) => {
    const u = userMap[row.userId] ?? {};
    const g = gamesByUser[row.userId] ?? { totalHours: 0, totalAchievements: 0, gamesCount: 0, platforms: new Set() };
    const name = u.name || "Gamer";
    return {
      rank: i + 1,
      userId: row.userId,
      isCurrentUser: row.userId === userId,
      gamerTag: name,
      avatarUrl: u.image ?? null,
      avatarInitials: name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      l9Points: row.l9Points,
      level: computeLevel(row.l9Points),
      totalHoursPlayed: Math.round(g.totalHours * 10) / 10,
      achievementsCount: g.totalAchievements,
      gamesCount: g.gamesCount,
      platforms: [...g.platforms].filter((p) => p !== "manual"),
      tribeTag: null,
      trend: "flat",
    };
  });

  // Current user rank — use global position from unfiltered list.
  let currentUserRank = null;
  if (globalIndex !== -1) {
    const cur = ledgerRows.find((r) => r.userId === userId);
    const cu = userMap[userId] ?? {};
    const cg = gamesByUser[userId] ?? { totalHours: 0, totalAchievements: 0, gamesCount: 0, platforms: new Set() };
    const curName = cu.name || session.user.name || "Gamer";
    currentUserRank = {
      rank: globalIndex + 1,
      userId,
      isCurrentUser: true,
      gamerTag: curName,
      avatarUrl: cu.image ?? session.user.image ?? null,
      avatarInitials: curName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      l9Points: cur?._sum.points ?? 0,
      level: computeLevel(cur?._sum.points ?? 0),
      totalHoursPlayed: Math.round(cg.totalHours * 10) / 10,
      achievementsCount: cg.totalAchievements,
      gamesCount: cg.gamesCount,
      platforms: [...cg.platforms].filter((p) => p !== "manual"),
      tribeTag: null,
      trend: "flat",
    };
  }

  return apiOk({ rankings, currentUserRank }, { _cacheSeconds: 120 });
}
