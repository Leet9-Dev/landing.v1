import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { PLATFORM_ACCOUNT_STATUS } from "@/lib/platforms/platforms";
import { emitProfileUpdatedEvent } from "@/lib/gamification/engine";
import { computeL9Points, computeLevel, computeRankInfo } from "@/lib/scoring/l9Points";
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
  const realName = session.user.name || "Gamer";

  const [platformRows, userGames, syncRuns, recentGameRows] = await Promise.all([
    prisma.platformAccount.findMany({
      where: { userId, status: PLATFORM_ACCOUNT_STATUS.CONNECTED },
    }),
    prisma.userGame.findMany({
      where: { userId },
      select: { playtimeHours: true, achievementsUnlocked: true },
    }),
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
    gamesCount: userGames.length,
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

  return apiOk({
    user,
    signatureGames: [],
    trophyCase: [],
    friendsComparison: [],
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
