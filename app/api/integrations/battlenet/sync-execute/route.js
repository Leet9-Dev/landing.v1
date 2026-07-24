import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchBattlenetGames } from "@/lib/integrations/battlenet/battlenetClient";
import { normalizeBattlenetGames } from "@/lib/integrations/battlenet/battlenetNormalizer";
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
    where: { userId_provider: { userId, provider: "battlenet" } },
  });

  if (!platformAccount || platformAccount.status !== "connected") {
    return apiError("PLATFORM_ACCOUNT_NOT_CONNECTED", "Connect your Battle.net account before syncing.", 400);
  }

  const battletag = platformAccount.externalUserId;

  const syncRun = await prisma.platformSyncRun.create({
    data: { platformAccountId: platformAccount.id, provider: "battlenet", mode: "execute", status: "syncing", startedAt: new Date() },
  });

  await prisma.platformAccount.update({ where: { id: platformAccount.id }, data: { syncStatus: "syncing" } });

  try {
    const rawGames = await fetchBattlenetGames(battletag ?? "fixture");
    const normalized = normalizeBattlenetGames(rawGames);

    const resolved = normalized.map((g) => ({
      ...g,
      canonicalGameId: matchDetectedGameToCanonical("battlenet", g.externalId, MOCK_EXTERNAL_SOURCES),
    }));

    const now = new Date();
    let userGamesCreated = 0;
    let userGamesUpdated = 0;
    let unmatchedCount = 0;
    const newGameIds = [];

    for (const g of resolved) {
      await prisma.platformDetectedGame.upsert({
        where: { platformAccountId_provider_externalGameId: { platformAccountId: platformAccount.id, provider: "battlenet", externalGameId: g.externalId } },
        create: { platformAccountId: platformAccount.id, syncRunId: syncRun.id, provider: "battlenet", externalGameId: g.externalId, externalTitle: g.externalTitle, playtimeHours: null, lastPlayedAt: g.lastPlayedAt ? new Date(g.lastPlayedAt) : null, canonicalGameId: g.canonicalGameId, matchStatus: g.canonicalGameId ? "matched" : "unmatched", normalized: g },
        update: { syncRunId: syncRun.id, lastPlayedAt: g.lastPlayedAt ? new Date(g.lastPlayedAt) : null, canonicalGameId: g.canonicalGameId, matchStatus: g.canonicalGameId ? "matched" : "unmatched", lastDetectedAt: now, normalized: g },
      });
    }

    for (const g of resolved) {
      if (!g.canonicalGameId) { unmatchedCount++; continue; }
      const existing = await prisma.userGame.findUnique({ where: { userId_canonicalGameId: { userId, canonicalGameId: g.canonicalGameId } }, select: { id: true } });
      await prisma.userGame.upsert({
        where: { userId_canonicalGameId: { userId, canonicalGameId: g.canonicalGameId } },
        create: { userId, canonicalGameId: g.canonicalGameId, sourceProvider: "battlenet", sourcePlatformAccountId: platformAccount.id, firstDetectedAt: now, lastDetectedAt: now, playtimeHours: null, sourceConfidence: "high" },
        update: { lastDetectedAt: now, sourceProvider: "battlenet", sourcePlatformAccountId: platformAccount.id, sourceConfidence: "high" },
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

    await prisma.platformSyncRun.update({ where: { id: syncRun.id }, data: { status: "success", finishedAt: new Date(), rawGamesDetected: rawGames.length, matchedCanonicalGames: matchedCount, unmatchedGames: unmatchedCount, userGamesToCreate: userGamesCreated, userGamesToUpdate: userGamesUpdated } });
    await prisma.platformAccount.update({ where: { id: platformAccount.id }, data: { syncStatus: "success", lastSyncAt: new Date() } });

    syncCooldowns.set(session.user.id, Date.now());

    return apiOk({ mode: "execute", provider: "battlenet", summary: { rawGamesDetected: rawGames.length, matchedCanonicalGames: matchedCount, unmatchedGames: unmatchedCount, userGamesCreated, userGamesUpdated } });
  } catch (error) {
    await prisma.platformSyncRun.update({ where: { id: syncRun.id }, data: { status: "failed", finishedAt: new Date(), errorMessage: error.message } }).catch(() => {});
    await prisma.platformAccount.update({ where: { id: platformAccount.id }, data: { syncStatus: "failed" } }).catch(() => {});
    throw error;
  }
}
