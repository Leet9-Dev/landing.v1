import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { PLATFORM_ACCOUNT_STATUS } from "@/lib/platforms/platforms";
import { emitProfileUpdatedEvent } from "@/lib/gamification/engine";
import { computeL9Points, computeLevel, computeLevelFromXp, computeRankInfo } from "@/lib/scoring/l9Points";
import { loadCurve } from "@/lib/scoring/levelCurve";
import { MOCK_GAMES } from "@/lib/mock/games";

const GAME_BY_ID = new Map(MOCK_GAMES.map((g) => [g.id, g]));

function relativeTime(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const GAME_PLATFORMS = ["steam", "psn", "xbox", "epic"];

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const [dbUser, platformRows, userGames, xpAgg, legacyPointsAgg, syncRuns, recentGameRows, allXpLedger, seasonScoreRow, levelCurve] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, image: true } }).catch(() => null),
    prisma.platformAccount.findMany({
      where: { userId, status: PLATFORM_ACCOUNT_STATUS.CONNECTED },
    }),
    prisma.userGame.findMany({
      where: { userId },
      select: { playtimeHours: true, achievementsUnlocked: true },
    }),
    // v2.2 primary: sum lifetime XP from XpLedger
    prisma.xpLedger.aggregate({ where: { userId }, _sum: { xpDelta: true } }).catch(() => ({ _sum: { xpDelta: null } })),
    // v1 fallback: PointsLedger (used when XpLedger is empty / pre-backfill)
    prisma.pointsLedger.aggregate({ where: { userId }, _sum: { points: true } }),
    prisma.platformSyncRun.findMany({
      where: { platformAccount: { userId }, mode: "execute", status: "success" },
      select: { id: true, provider: true, finishedAt: true, userGamesToCreate: true, matchedCanonicalGames: true },
      orderBy: { finishedAt: "desc" },
      take: 10,
    }),
    prisma.userGame.findMany({
      where: { userId, firstDetectedAt: { not: null } },
      select: { canonicalGameId: true, firstDetectedAt: true, sourceProvider: true, playtimeHours: true, achievementsUnlocked: true },
      orderBy: { firstDetectedAt: "desc" },
      take: 10,
    }),
    // For leaderboard: sum XP per user from XpLedger (primary), fallback handled below
    prisma.xpLedger.groupBy({ by: ["userId"], _sum: { xpDelta: true } }).catch(() => []),
    // Current season SP for this user
    prisma.seasonScore.findFirst({
      where: { userId },
      orderBy: { seasonId: "desc" },
      select: { spTotal: true, tier: true, seasonId: true },
    }).catch(() => null),
    // Level curve for v2.2 level calculation
    loadCurve().catch(() => []),
  ]);

  const realName = dbUser?.name || session.user.name || "Gamer";

  const platformsConnected = platformRows
    .map((r) => r.provider)
    .filter((p) => GAME_PLATFORMS.includes(p));

  // E3 Cutover: XpLedger is the primary source of truth for lifetime XP.
  // Fall back to PointsLedger for users whose XpLedger is empty (pre-backfill).
  const xpFromV2 = xpAgg._sum.xpDelta ?? 0;
  const xpFromV1 = legacyPointsAgg._sum.points ?? 0;
  const lifetimeXp = xpFromV2 > 0 ? xpFromV2 : xpFromV1;
  const l9Points = lifetimeXp; // alias kept for downstream references
  const seasonSp = seasonScoreRow?.spTotal ?? 0;

  // Level from v2.2 curve; falls back to v1 formula if curve is empty.
  const level = levelCurve.length > 0
    ? computeLevelFromXp(lifetimeXp, levelCurve)
    : computeLevel(lifetimeXp);

  const rankInfo = computeRankInfo(lifetimeXp);
  const rankTier = rankInfo.rankTier;
  const nextRank = rankInfo.nextRank;
  const rankProgressPct = rankInfo.rankProgressPct;
  const pointsToNextRank = rankInfo.pointsToNextRank;

  const user = {
    id: userId,
    gamerTag: realName,
    displayName: realName,
    avatarUrl: dbUser?.image || session.user.image || null,
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
    gamesCount: userGames.length,
    lifetimeXp,
    seasonSp,
    seasonId: seasonScoreRow?.seasonId ?? 0,
  };

  // Build recentActivity events for the profile overview.
  const syncEvents = syncRuns
    .filter((r) => r.finishedAt)
    .map((r) => ({
      id: `sync_${r.id}`,
      icon: "🔄",
      label: `Synced ${r.provider === "steam" ? "Steam" : r.provider.toUpperCase()} library — ${r.userGamesToCreate} game${r.userGamesToCreate === 1 ? "" : "s"} added`,
      pointsDelta: null,
      occurredAtLabel: relativeTime(r.finishedAt),
      _ts: new Date(r.finishedAt).getTime(),
    }));

  const gameEvents = recentGameRows
    .filter((ug) => ug.firstDetectedAt)
    .map((ug) => {
      const meta = GAME_BY_ID.get(ug.canonicalGameId);
      const pts = computeL9Points({ playtimeHours: ug.playtimeHours ?? 0, achievementsUnlocked: ug.achievementsUnlocked ?? 0 });
      return {
        id: `game_${ug.canonicalGameId}`,
        icon: "🎮",
        label: `Added ${meta?.canonicalTitle ?? ug.canonicalGameId} to your library`,
        pointsDelta: pts > 0 ? pts : null,
        occurredAtLabel: relativeTime(ug.firstDetectedAt),
        _ts: new Date(ug.firstDetectedAt).getTime(),
      };
    });

  const recentActivity = [...syncEvents, ...gameEvents]
    .sort((a, b) => b._ts - a._ts)
    .slice(0, 10)
    .map(({ _ts, ...rest }) => rest);

  // Nearby players in global ranking (2 above, current user, 2 below).
  // E3: use XpLedger as primary; fall back to PointsLedger groupBy if XpLedger is empty.
  const xpRanked = allXpLedger.map((r) => ({ userId: r.userId, total: r._sum.xpDelta ?? 0 }));
  const ranked = (xpRanked.length > 0 ? xpRanked : [])
    .sort((a, b) => b.total - a.total);

  const myIdx = ranked.findIndex((r) => r.userId === userId);
  const nearbySlice = myIdx !== -1
    ? ranked.slice(Math.max(0, myIdx - 2), myIdx + 3)
    : [];

  let friendsComparison = [];
  if (nearbySlice.length > 0) {
    const nearbyIds = nearbySlice.map((r) => r.userId).filter((id) => id !== userId);
    const [nearbyUsers, nearbyAchievements] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: nearbyIds } },
        select: { id: true, name: true, image: true },
      }),
      prisma.userGame.groupBy({
        by: ["userId"],
        where: { userId: { in: nearbySlice.map((r) => r.userId) } },
        _sum: { achievementsUnlocked: true },
      }),
    ]);

    const nearbyUserMap = Object.fromEntries(nearbyUsers.map((u) => [u.id, u]));
    const achieveMap = Object.fromEntries(nearbyAchievements.map((r) => [r.userId, r._sum.achievementsUnlocked ?? 0]));
    const baseRank = Math.max(0, myIdx - 2);

    friendsComparison = nearbySlice.map((r, i) => {
      const isMe = r.userId === userId;
      const u = nearbyUserMap[r.userId] ?? {};
      const name = isMe ? realName : (u.name || "Gamer");
      return {
        userId: r.userId,
        rank: baseRank + i + 1,
        isCurrentUser: isMe,
        gamerTag: name,
        avatarUrl: isMe ? (dbUser?.image ?? session.user.image ?? null) : (u.image ?? null),
        l9Points: r.total,
        achievementsEarned: achieveMap[r.userId] ?? 0,
        trend: "flat",
      };
    });
  }

  return apiOk({
    user,
    signatureGames: [],
    trophyCase: [],
    friendsComparison,
    recentActivity,
  });
}

export async function PATCH(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const body = await request.json().catch(() => ({}));

  const updateData = {};
  const gamificationTriggers = [];

  if (typeof body.displayName === "string") {
    const displayName = body.displayName.trim();
    if (!displayName || displayName.length < 1 || displayName.length > 32) {
      return apiError("INVALID_DISPLAY_NAME", "Display name must be 1–32 characters.", 400);
    }
    updateData.name = displayName;
    gamificationTriggers.push("displayName");
  }

  if (typeof body.bio === "string") {
    const bio = body.bio.trim().slice(0, 300);
    updateData.bio = bio;
    if (bio.length > 0) gamificationTriggers.push("bio");
  }

  if (typeof body.location === "string") {
    const location = body.location.trim().slice(0, 100);
    updateData.location = location;
    if (location.length > 0) gamificationTriggers.push("location");
  }

  if (Object.keys(updateData).length === 0) {
    return apiError("NO_CHANGES", "No valid fields to update.", 400);
  }

  await prisma.user.update({ where: { id: userId }, data: updateData });

  for (const field of gamificationTriggers) {
    emitProfileUpdatedEvent(prisma, userId, field).catch(() => {});
  }

  return apiOk({ ...updateData });
}
