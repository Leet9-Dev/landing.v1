import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchSteamOwnedGames, hasSteamApiKey } from "@/lib/integrations/steam/steamClient";
import { normalizeSteamGames } from "@/lib/integrations/steam/steamNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";
import { emitGameAddedEvent } from "@/lib/gamification/engine";

// Steam library execute sync (Phase 17).
//
// Fetches the current user's real Steam library, normalizes and matches games,
// then persists PlatformDetectedGame and UserGame rows. All upserts are
// idempotent: re-running produces no duplicates. A PlatformSyncRun row is
// created at the start and stamped with the result on completion or failure.
//
// Requirements:
//   - Authenticated session
//   - STEAM_API_KEY set in environment
//   - A connected PlatformAccount with a steamid64

// Simple in-memory rate limit: 1 sync per user per 5 minutes.
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

  if (!hasSteamApiKey()) {
    return apiError("STEAM_API_KEY_MISSING", "STEAM_API_KEY is required to run an execute sync.", 503);
  }

  const userId = session.user.id;

  const platformAccount = await prisma.platformAccount.findUnique({
    where: { userId_provider: { userId, provider: "steam" } },
  });

  if (!platformAccount || platformAccount.status !== "connected") {
    return apiError("PLATFORM_ACCOUNT_NOT_CONNECTED", "Connect your Steam account before syncing.", 400);
  }

  const steamId64 = platformAccount.externalUserId;
  if (!steamId64) {
    return apiError("STEAM_ID_MISSING", "No steamID64 on the connected account.", 400);
  }

  // Create a sync run record to track this attempt.
  const syncRun = await prisma.platformSyncRun.create({
    data: {
      platformAccountId: platformAccount.id,
      provider: "steam",
      mode: "execute",
      status: "syncing",
      startedAt: new Date(),
    },
  });

  // Mark account as syncing immediately so the UI can reflect it.
  await prisma.platformAccount.update({
    where: { id: platformAccount.id },
    data: { syncStatus: "syncing" },
  });

  try {
    // 1. Fetch raw Steam library.
    const rawGames = await fetchSteamOwnedGames(steamId64);

    if (rawGames.length === 0) {
      // Private profile or empty library — not an error, but nothing to sync.
      await prisma.platformSyncRun.update({
        where: { id: syncRun.id },
        data: { status: "success", finishedAt: new Date(), rawGamesDetected: 0, warnings: ["Steam returned 0 games. Library may be private."] },
      });
      await prisma.platformAccount.update({
        where: { id: platformAccount.id },
        data: { syncStatus: "success", lastSyncAt: new Date() },
      });
      return apiOk({
        mode: "execute",
        provider: "steam",
        summary: { rawGamesDetected: 0, matchedCanonicalGames: 0, unmatchedGames: 0, userGamesCreated: 0, userGamesUpdated: 0 },
        warnings: ["Steam returned 0 games. Library may be set to private."],
      });
    }

    // 2. Normalize.
    const normalized = normalizeSteamGames(rawGames);

    // 3. Match to canonical using the external-source catalogue.
    const resolved = normalized.map((g) => ({
      ...g,
      canonicalGameId: matchDetectedGameToCanonical("steam", g.externalId, MOCK_EXTERNAL_SOURCES),
    }));

    const now = new Date();
    let userGamesCreated = 0;
    let userGamesUpdated = 0;
    let unmatchedCount = 0;
    const newGameIds = [];

    // 4. Upsert PlatformDetectedGame for every raw game (matched + unmatched).
    //    The unique constraint (platformAccountId, provider, externalGameId)
    //    guarantees idempotency — re-running updates playtime without duplication.
    for (const g of resolved) {
      await prisma.platformDetectedGame.upsert({
        where: {
          platformAccountId_provider_externalGameId: {
            platformAccountId: platformAccount.id,
            provider: "steam",
            externalGameId: g.externalId,
          },
        },
        create: {
          platformAccountId: platformAccount.id,
          syncRunId: syncRun.id,
          provider: "steam",
          externalGameId: g.externalId,
          externalTitle: g.externalTitle,
          playtimeHours: g.playtimeHours,
          lastPlayedAt: g.lastPlayedAt ? new Date(g.lastPlayedAt) : null,
          canonicalGameId: g.canonicalGameId,
          matchStatus: g.canonicalGameId ? "matched" : "unmatched",
          normalized: g,
        },
        update: {
          syncRunId: syncRun.id,
          playtimeHours: g.playtimeHours,
          lastPlayedAt: g.lastPlayedAt ? new Date(g.lastPlayedAt) : null,
          canonicalGameId: g.canonicalGameId,
          matchStatus: g.canonicalGameId ? "matched" : "unmatched",
          lastDetectedAt: now,
          normalized: g,
        },
      });
    }

    // 5. Upsert UserGame for matched games only.
    //    The unique constraint (userId, canonicalGameId) guarantees idempotency.
    for (const g of resolved) {
      if (!g.canonicalGameId) {
        unmatchedCount++;
        continue;
      }

      const existing = await prisma.userGame.findUnique({
        where: { userId_canonicalGameId: { userId, canonicalGameId: g.canonicalGameId } },
        select: { id: true },
      });

      await prisma.userGame.upsert({
        where: { userId_canonicalGameId: { userId, canonicalGameId: g.canonicalGameId } },
        create: {
          userId,
          canonicalGameId: g.canonicalGameId,
          sourceProvider: "steam",
          sourcePlatformAccountId: platformAccount.id,
          firstDetectedAt: now,
          lastDetectedAt: now,
          playtimeHours: g.playtimeHours,
          sourceConfidence: "high",
        },
        update: {
          playtimeHours: g.playtimeHours,
          lastDetectedAt: now,
          sourceProvider: "steam",
          sourcePlatformAccountId: platformAccount.id,
          sourceConfidence: "high",
        },
      });

      if (existing) {
        userGamesUpdated++;
      } else {
        userGamesCreated++;
        newGameIds.push(g.canonicalGameId);
      }
    }

    const matchedCount = resolved.filter((g) => g.canonicalGameId).length;

    // 5b. Fire gamification events for each newly detected game (non-blocking).
    if (newGameIds.length > 0) {
      const totalGamesRow = await prisma.userGame.count({ where: { userId } });
      for (let i = 0; i < newGameIds.length; i++) {
        const runningTotal = totalGamesRow - newGameIds.length + i + 1;
        emitGameAddedEvent(prisma, userId, newGameIds[i], runningTotal).catch(() => {});
      }
    }

    // 6. Stamp the sync run as complete.
    await prisma.platformSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        rawGamesDetected: rawGames.length,
        matchedCanonicalGames: matchedCount,
        unmatchedGames: unmatchedCount,
        userGamesToCreate: userGamesCreated,
        userGamesToUpdate: userGamesUpdated,
      },
    });

    await prisma.platformAccount.update({
      where: { id: platformAccount.id },
      data: { syncStatus: "success", lastSyncAt: new Date() },
    });

    syncCooldowns.set(session.user.id, Date.now());

    return apiOk({
      mode: "execute",
      provider: "steam",
      summary: {
        rawGamesDetected: rawGames.length,
        matchedCanonicalGames: matchedCount,
        unmatchedGames: unmatchedCount,
        userGamesCreated,
        userGamesUpdated,
      },
    });
  } catch (error) {
    await prisma.platformSyncRun.update({
      where: { id: syncRun.id },
      data: { status: "failed", finishedAt: new Date(), errorMessage: error.message },
    }).catch(() => {});
    await prisma.platformAccount.update({
      where: { id: platformAccount.id },
      data: { syncStatus: "failed" },
    }).catch(() => {});
    throw error;
  }
}
