import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { computeL9Points, computeLevel } from "@/lib/scoring/l9Points";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  // Fetch all user game rows to aggregate per user.
  const allRows = await prisma.userGame.findMany({
    select: {
      userId: true,
      playtimeHours: true,
      achievementsUnlocked: true,
      sourceProvider: true,
    },
  });

  if (allRows.length === 0) {
    return apiOk({ rankings: [], currentUserRank: null });
  }

  // Aggregate per user.
  const byUser = {};
  for (const row of allRows) {
    if (!byUser[row.userId]) {
      byUser[row.userId] = { totalHours: 0, totalAchievements: 0, gamesCount: 0, platforms: new Set() };
    }
    byUser[row.userId].totalHours += row.playtimeHours ?? 0;
    byUser[row.userId].totalAchievements += row.achievementsUnlocked ?? 0;
    byUser[row.userId].gamesCount += 1;
    if (row.sourceProvider) byUser[row.userId].platforms.add(row.sourceProvider);
  }

  // Compute L9 Points and sort.
  const scored = Object.entries(byUser)
    .map(([uid, agg]) => ({
      userId: uid,
      totalHours: agg.totalHours,
      totalAchievements: agg.totalAchievements,
      gamesCount: agg.gamesCount,
      platforms: [...agg.platforms].filter((p) => p !== "manual"),
      l9Points: computeL9Points({ playtimeHours: agg.totalHours, achievementsUnlocked: agg.totalAchievements }),
    }))
    .sort((a, b) => b.l9Points - a.l9Points);

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
      totalHoursPlayed: Math.round(row.totalHours * 10) / 10,
      achievementsCount: row.totalAchievements,
      gamesCount: row.gamesCount,
      platforms: row.platforms,
      tribeTag: null,
      trend: "flat",
    };
  });

  // Find current user rank (may be outside top 100).
  const currentUserIndex = scored.findIndex((r) => r.userId === userId);
  let currentUserRank = null;
  if (currentUserIndex !== -1) {
    const cur = scored[currentUserIndex];
    const cu = userMap[userId] ?? {};
    const curName = cu.name || session.user.name || "Gamer";
    currentUserRank = {
      rank: currentUserIndex + 1,
      userId,
      isCurrentUser: true,
      gamerTag: curName,
      avatarUrl: cu.image ?? session.user.image ?? null,
      avatarInitials: curName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      l9Points: cur.l9Points,
      level: computeLevel(cur.l9Points),
      totalHoursPlayed: Math.round(cur.totalHours * 10) / 10,
      achievementsCount: cur.totalAchievements,
      gamesCount: cur.gamesCount,
      platforms: cur.platforms,
      tribeTag: null,
      trend: "flat",
    };
  }

  return apiOk({ rankings, currentUserRank });
}
