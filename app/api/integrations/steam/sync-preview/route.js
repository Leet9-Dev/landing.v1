import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { fetchSteamOwnedGames, DRY_RUN } from "@/lib/integrations/steam/steamClient";
import { planSteamSync } from "@/lib/integrations/steam/steamSyncPlanner";
import { normalizeOwnedGamesResponse } from "@/lib/integrations/steam/steamNormalizer";
import {
  fetchSteamOwnedGamesLive,
  isSteamConfigured,
  SteamConfigError,
  SteamApiError,
} from "@/lib/integrations/steam/steamApiClient";
import { PLATFORM_SYNC_STATUS } from "@/lib/platforms/platforms";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";
import { MOCK_USER_GAMES } from "@/lib/mock/userGames";

// GET — legacy mock DRY-RUN preview (Phase 9). No real Steam API, no persistence.
// Kept for backward compatibility and offline review of the planner logic.
export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const rawSteamGames = await fetchSteamOwnedGames("dry_run_no_steamid");
  const plan = planSteamSync({
    rawSteamGames,
    externalSources: MOCK_EXTERNAL_SOURCES,
    existingUserGames: MOCK_USER_GAMES,
  });

  return apiOk(
    { ...plan, dryRunNote: "No data was persisted. No real Steam API was called." },
    { dryRun: DRY_RUN, provider: "steam" },
  );
}

// POST — REAL Steam owned-games sync (Phase 17). Strict mode:
//   mode: "preview" (default) — calls Steam, normalizes in memory, writes NOTHING.
//   mode: "execute"           — calls Steam, records a PlatformSyncRun, and
//                               idempotently upserts PlatformDetectedGame rows.
// Does NOT do canonical matching (GameExternalSource) or create UserGame, and
// does NOT affect Discovery/Profile/Stats/Rankings.
export async function POST(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;
  const userId = session.user.id;

  let body = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const mode = body?.mode === "execute" ? "execute" : "preview";

  const account = await prisma.platformAccount.findUnique({
    where: { userId_provider: { userId, provider: "steam" } },
  });
  if (!account) {
    return apiError("PLATFORM_ACCOUNT_NOT_FOUND", "No connected Steam account to sync.", 404);
  }
  if (account.status !== "connected") {
    return apiError("PLATFORM_ACCOUNT_DISCONNECTED", "Reconnect your Steam account before syncing.", 409);
  }

  const steamId64 = account.externalUserId;
  if (!steamId64 || !/^\d{17}$/.test(steamId64)) {
    return apiError("VALIDATION_ERROR", "Stored Steam ID is not a valid steamID64.", 400);
  }
  if (!isSteamConfigured()) {
    return apiError("STEAM_NOT_CONFIGURED", "Steam sync is not configured on the server yet.", 503);
  }

  if (mode === "preview") {
    return runPreview(steamId64);
  }
  return runExecute(account, steamId64);
}

// PREVIEW: read-only. Calls Steam, normalizes in memory, persists nothing.
// (No PlatformSyncRun is created — preview must have no DB side effects.)
async function runPreview(steamId64) {
  let owned;
  try {
    owned = await fetchSteamOwnedGamesLive(steamId64);
  } catch (err) {
    return steamErrorResponse(err);
  }

  const normalized = normalizeOwnedGamesResponse(owned);
  const sample = normalized.games.slice(0, 8).map((g) => ({
    externalGameId: g.externalGameId,
    externalTitle: g.externalTitle,
    playtimeHours: g.playtimeHours,
    lastPlayedAt: g.lastPlayedAt,
  }));

  return apiOk(
    {
      mode: "preview",
      provider: "steam",
      persisted: false,
      executeAvailable: normalized.total > 0,
      summary: {
        gameCount: owned.game_count,
        normalizedTotal: normalized.total,
        skipped: normalized.skipped,
        libraryVisible: (owned.games?.length ?? 0) > 0,
      },
      sample,
      note: "Preview only — no games were saved. Run execute to store detected games (this does not yet affect Discovery/Profile/Stats/Rankings).",
    },
    { source: "steam_api", provider: "steam" },
  );
}

// EXECUTE: records a PlatformSyncRun and idempotently upserts PlatformDetectedGame
// rows. Idempotent via @@unique([platformAccountId, provider, externalGameId]) —
// rerunning updates rows in place, never duplicates them.
async function runExecute(account, steamId64) {
  const run = await prisma.platformSyncRun.create({
    data: {
      platformAccountId: account.id,
      provider: "steam",
      mode: "execute",
      status: PLATFORM_SYNC_STATUS.SYNCING,
      startedAt: new Date(),
    },
  });

  try {
    const owned = await fetchSteamOwnedGamesLive(steamId64);
    const normalized = normalizeOwnedGamesResponse(owned);
    const now = new Date();

    const upserts = normalized.games.map((g) => {
      const normalizedJson = {
        externalGameId: g.externalGameId,
        externalTitle: g.externalTitle,
        playtimeHours: g.playtimeHours,
        playtimeMinutes: g.playtimeMinutes,
        lastPlayedAt: g.lastPlayedAt,
      };
      const lastPlayed = g.lastPlayedAt ? new Date(g.lastPlayedAt) : null;
      return prisma.platformDetectedGame.upsert({
        where: {
          platformAccountId_provider_externalGameId: {
            platformAccountId: account.id,
            provider: "steam",
            externalGameId: g.externalGameId,
          },
        },
        create: {
          platformAccountId: account.id,
          syncRunId: run.id,
          provider: "steam",
          externalGameId: g.externalGameId,
          externalTitle: g.externalTitle,
          playtimeHours: g.playtimeHours,
          lastPlayedAt: lastPlayed,
          matchStatus: "unmatched", // canonical matching is a later phase
          raw: g.raw,
          normalized: normalizedJson,
        },
        update: {
          // Never touch matchStatus/canonicalGameId (future phase) or firstDetectedAt.
          syncRunId: run.id,
          externalTitle: g.externalTitle,
          playtimeHours: g.playtimeHours,
          lastPlayedAt: lastPlayed,
          raw: g.raw,
          normalized: normalizedJson,
          lastDetectedAt: now,
        },
      });
    });

    // Atomic: all detected-game upserts + run finalization succeed together.
    const finalizeRun = prisma.platformSyncRun.update({
      where: { id: run.id },
      data: {
        status: PLATFORM_SYNC_STATUS.SUCCESS,
        finishedAt: now,
        rawGamesDetected: normalized.total,
        matchedCanonicalGames: 0,
        unmatchedGames: normalized.total,
        userGamesToCreate: 0,
        userGamesToUpdate: 0,
        warnings: normalized.skipped > 0 ? [`${normalized.skipped} entries skipped (invalid/missing appid).`] : [],
        metadata: { gameCount: owned.game_count, skipped: normalized.skipped },
      },
    });

    await prisma.$transaction([...upserts, finalizeRun]);

    await prisma.platformAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: now, syncStatus: PLATFORM_SYNC_STATUS.SUCCESS },
    });

    return apiOk(
      {
        mode: "execute",
        provider: "steam",
        persisted: true,
        syncRunId: run.id,
        summary: {
          gameCount: owned.game_count,
          detectedGamesWritten: normalized.total,
          skipped: normalized.skipped,
        },
        note: "Detected games saved as unmatched detections. Canonical matching and profile/stats impact are later phases.",
      },
      { source: "steam_api", provider: "steam" },
    );
  } catch (err) {
    // Record the failure on the run (sanitized) and surface a safe error.
    const code = err instanceof SteamConfigError ? "STEAM_NOT_CONFIGURED" : err instanceof SteamApiError ? "STEAM_API_ERROR" : "INTERNAL_ERROR";
    await prisma.platformSyncRun.update({
      where: { id: run.id },
      data: {
        status: PLATFORM_SYNC_STATUS.FAILED,
        finishedAt: new Date(),
        errorCode: code,
        errorMessage: sanitizeErrorMessage(err),
      },
    }).catch(() => {});
    await prisma.platformAccount.update({
      where: { id: account.id },
      data: { syncStatus: PLATFORM_SYNC_STATUS.FAILED },
    }).catch(() => {});

    return steamErrorResponse(err);
  }
}

// Map a Steam client error to a safe HTTP response — never leaks key/URL/stack.
function steamErrorResponse(err) {
  if (err instanceof SteamConfigError) {
    return apiError("STEAM_NOT_CONFIGURED", "Steam sync is not configured on the server yet.", 503);
  }
  if (err instanceof SteamApiError) {
    return apiError("STEAM_API_ERROR", "Could not reach Steam right now. Please try again later.", 502);
  }
  return apiError("INTERNAL_ERROR", "Unexpected error during Steam sync.", 500);
}

// Only the safe message text is retained (SteamApiError messages contain only an
// HTTP status; SteamConfigError has no sensitive content). Never the URL/key.
function sanitizeErrorMessage(err) {
  if (err instanceof SteamApiError || err instanceof SteamConfigError) return err.message;
  return "Unexpected error during Steam sync.";
}
