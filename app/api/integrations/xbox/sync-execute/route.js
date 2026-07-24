import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchXboxOwnedGames } from "@/lib/integrations/xbox/xboxClient";
import { normalizeXboxGames } from "@/lib/integrations/xbox/xboxNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";
import { emitGameAddedEvent } from "@/lib/gamification/engine";

const syncCooldowns = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;

export async function POST() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const lastSync = syncCooldowns.get(session.user.id);
  if (lastSync && Date.now() - lastSync < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastSync)) / 1000);
    return apiError("SYNC_COOLDOWN", `Sync is on cooldown. Try again in ${remaining}s.`, 429);
  }

  const userId = session.user.id;

  const platformAccount = await prisma.platformAccount.findUnique({
    where: { userId_provider: { userId, provider: "xbox" } },
  });

  if (!platformAccount || platformAccount.status !== "connected") {
    return apiError("PLATFORM_ACCOUNT_NOT_CONNECTED", "Connect your Xbox account before syncing.", 400);
  }

  const gamertag = platformAccount.externalUserId;

  const syncRun = await prisma.platformSyncRun.create({
    data: { platformAccountId: platformAccount.id, provider: "xbox", mode: "execute", status: "syncing", startedAt: new Date() },
  });

  await prisma.platformAccount.update({
    where: { id: platformAccount.id },
    data: { syncStatus: "syncing" },
  });

  try {
    // Falls back to fixture data when XBOX_API_KEY is not set.
    const rawGames = await fetchXboxOwnedGames(gamertag ?? "fixture");
    const normalized = normalizeXboxGames(rawGames);

    const resolved = normalized.map((g) => ({
      ...g,
      canonicalGameId: matchDetectedGameToCanonical("xbox", g.externalId, MOCK_EXTERNAL_SOURCES),
    }));

    const now = new Date();
    let userGamesCreated = 0;
    let userGamesUpdated = 0;
    let unmatchedCount = 0;
    const newGameIds = [];

    for (const g of resolved) {
      await prisma.platformDetectedGame.upsert({
        where: { platformAccountId_provider_externalGameId: { platformAccountId: platformAccount.id, provider: "xbox", externalGameId: g.externalId } },
        create: { platformAccountId: platformAccount.id, syncRunId: syncRun.id, provider: "xbox", externalGameId: g.externalId, externalTitle: g.externalTitle, playtimeHours: g.playtimeHours, lastPlayedAt: g.lastPlayedAt ? new Date(g.lastPlayedAt) : null, canonicalGameId: g.canonicalGameId, matchStatus: g.canonicalGameId ? "matched" : "unmatched", normalized: g },
        update: { syncRunId: syncRun.id, playtimeHours: g.playtimeHours, lastPlayedAt: g.lastPlayedAt ? new Date(g.lastPlayedAt) : null, canonicalGameId: g.canonicalGameId, matchStatus: g.canonicalGameId ? "matched" : "unmatched", lastDetectedAt: now, normalized: g },
      });
    }

    for (const g of resolved) {
      if (!g.canonicalGameId) { unmatchedCount++; continue; }
      const existing = await prisma.userGame.findUnique({ where: { userId_canonicalGameId: { userId, canonicalGameId: g.canonicalGameId } }, select: { id: true } });
      await prisma.userGame.upsert({
        where: { userId_canonicalGameId: { userId, canonicalGameId: g.canonicalGameId } },
        create: { userId, canonicalGameId: g.canonicalGameId, sourceProvider: "xbox", sourcePlatformAccountId: platformAccount.id, firstDetectedAt: now, lastDetectedAt: now, playtimeHours: g.playtimeHours, sourceConfidence: "high" },
        update: { playtimeHours: g.playtimeHours, lastDetectedAt: now, sourceProvider: "xbox", sourcePlatformAccountId: platformAccount.id, sourceConfidence: "high" },
      });
      if (existing) { userGamesUpdated++; } else { userGamesCreated++; newGameIds.push(g.canonicalGameId); }
    }

    const matchedCount = resolved.filter((g) => g.canonicalGameId).length;

    if (newGameIds.length > 0) {
      const totalGamesRow = await prisma.userGame.count({ where: { userId } });
      for (let i = 0; i < newGameIds.length; i++) {
        const runningTotal = totalGamesRow - newGameIds.length + i + 1;
        emitGameAddedEvent(prisma, userId, newGameIds[i], runningTotal).catch(() => {});
      }
    }

    await prisma.platformSyncRun.update({
      where: { id: syncRun.id },
      data: { status: "success", finishedAt: new Date(), rawGamesDetected: rawGames.length, matchedCanonicalGames: matchedCount, unmatchedGames: unmatchedCount, userGamesToCreate: userGamesCreated, userGamesToUpdate: userGamesUpdated },
    });
    await prisma.platformAccount.update({ where: { id: platformAccount.id }, data: { syncStatus: "success", lastSyncAt: new Date() } });

    syncCooldowns.set(session.user.id, Date.now());

    return apiOk({ mode: "execute", provider: "xbox", summary: { rawGamesDetected: rawGames.length, matchedCanonicalGames: matchedCount, unmatchedGames: unmatchedCount, userGamesCreated, userGamesUpdated } });
  } catch (error) {
    await prisma.platformSyncRun.update({ where: { id: syncRun.id }, data: { status: "failed", finishedAt: new Date(), errorMessage: error.message } }).catch(() => {});
    await prisma.platformAccount.update({ where: { id: platformAccount.id }, data: { syncStatus: "failed" } }).catch(() => {});
    throw error;
  }
}
