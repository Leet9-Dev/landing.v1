// Persistence mapping helpers (Phase 10).
//
// PURE and SIDE-EFFECT FREE. These functions only shape plain objects that
// describe how normalized platform data WOULD map onto the Phase 10 Prisma
// models. They perform NO database writes and import NO Prisma client. Real
// persistence is wired in a later phase.
//
// They make the normalized ingestion flow explicit and testable:
//
//   Normalized Detected Game  --toPlatformDetectedGameRecord-->  PlatformDetectedGame
//   GameExternalSource lookup --matchStatusFor / toGameExternalSourceRecord
//   Matched game (new)        --toUserGameCreate-->              UserGame (create)
//   Matched game (existing)   --toUserGameUpdatePatch-->         UserGame (update)
//
// Status strings come from the official vocabularies in platforms.js so the
// DB rows and the JS constants never drift.

import { PLATFORM_ACCOUNT_STATUS, PLATFORM_SYNC_STATUS } from "@/lib/platforms/platforms";

// PlatformDetectedGame.matchStatus values.
export const DETECTED_GAME_MATCH_STATUS = {
  MATCHED: "matched",
  UNMATCHED: "unmatched",
  IGNORED: "ignored",
};

// GameExternalSource.status values.
export const EXTERNAL_SOURCE_STATUS = {
  ACTIVE: "active",
  DEPRECATED: "deprecated",
  REVIEW_REQUIRED: "review_required",
};

// PlatformSyncRun.mode values.
export const SYNC_RUN_MODE = {
  DRY_RUN: "dry_run",
  EXECUTE: "execute",
};

/** Derive a PlatformDetectedGame.matchStatus from a resolved canonical id. */
export function matchStatusFor(canonicalGameId) {
  return canonicalGameId
    ? DETECTED_GAME_MATCH_STATUS.MATCHED
    : DETECTED_GAME_MATCH_STATUS.UNMATCHED;
}

/**
 * Shape a normalized detected game into a PlatformDetectedGame row payload.
 * `raw` is the untrusted platform payload (kept for audit); `normalized` is the
 * Leet9-shaped object. No write is performed.
 */
export function toPlatformDetectedGameRecord(normalized, { platformAccountId, syncRunId = null, raw = null } = {}) {
  return {
    platformAccountId,
    syncRunId,
    provider: normalized.platform,
    externalGameId: String(normalized.externalId),
    externalTitle: normalized.externalTitle ?? null,
    playtimeHours: normalized.playtimeHours ?? null,
    achievementsUnlocked: normalized.achievementsUnlocked ?? null,
    trophiesUnlocked: normalized.trophiesUnlocked ?? null,
    lastPlayedAt: normalized.lastPlayedAt ?? null,
    canonicalGameId: normalized.canonicalGameId ?? null,
    matchStatus: matchStatusFor(normalized.canonicalGameId),
    raw,
    normalized,
  };
}

/**
 * Build the UserGame create payload for a matched detected game with no existing
 * UserGame. Mirrors the planner's "create" path.
 */
export function toUserGameCreate(matchedGame, { userId, sourcePlatformAccountId = null } = {}) {
  return {
    userId,
    canonicalGameId: matchedGame.canonicalGameId,
    sourceProvider: matchedGame.platform,
    sourcePlatformAccountId,
    firstDetectedAt: matchedGame.lastPlayedAt ?? null,
    lastDetectedAt: matchedGame.lastPlayedAt ?? null,
    playtimeHours: matchedGame.playtimeHours ?? null,
    achievementsUnlocked: matchedGame.achievementsUnlocked ?? null,
    trophiesUnlocked: matchedGame.trophiesUnlocked ?? null,
    sourceConfidence: matchedGame.sourceConfidence ?? null,
  };
}

/**
 * Build a partial UserGame update patch for a matched detected game that already
 * has a UserGame. Only fields that would change on sync are included. Mirrors the
 * planner's "update" path (playtime/lastPlayed first; achievements are a follow-up).
 */
export function toUserGameUpdatePatch(matchedGame, existingUserGame) {
  const patch = { lastDetectedAt: matchedGame.lastPlayedAt ?? existingUserGame.lastPlayedAt ?? null };
  if (matchedGame.playtimeHours != null && matchedGame.playtimeHours !== existingUserGame.playtimeHours) {
    patch.playtimeHours = matchedGame.playtimeHours;
  }
  if (matchedGame.lastPlayedAt) {
    patch.lastPlayedAt = matchedGame.lastPlayedAt;
  }
  return patch;
}

/**
 * Shape a matched detected game into a GameExternalSource upsert payload. This is
 * how a confirmed (platform, externalId) → canonicalGameId mapping would be
 * persisted. Canonical game data itself is never duplicated here.
 */
export function toGameExternalSourceRecord(matchedGame, { confidence = null } = {}) {
  return {
    provider: matchedGame.platform,
    externalGameId: String(matchedGame.externalId),
    externalTitle: matchedGame.externalTitle ?? null,
    canonicalGameId: matchedGame.canonicalGameId,
    confidence,
    status: EXTERNAL_SOURCE_STATUS.ACTIVE,
  };
}

/**
 * Build the initial PlatformSyncRun row payload for a run. Defaults to dry-run
 * and idle status, using the official sync-status vocabulary.
 */
export function toSyncRunRecord({ platformAccountId, provider, mode = SYNC_RUN_MODE.DRY_RUN } = {}) {
  return {
    platformAccountId,
    provider,
    mode,
    status: PLATFORM_SYNC_STATUS.IDLE,
    rawGamesDetected: 0,
    matchedCanonicalGames: 0,
    unmatchedGames: 0,
    userGamesToCreate: 0,
    userGamesToUpdate: 0,
  };
}

/**
 * Translate a dry-run sync plan (from steamSyncPlanner.planSteamSync, or any
 * platform planner with the same shape) into the counters that would be written
 * onto a PlatformSyncRun. Pure — used for documentation/tests, not writes.
 */
export function syncPlanToRunCounters(plan) {
  const s = plan?.summary ?? {};
  return {
    rawGamesDetected: s.rawGamesDetected ?? 0,
    matchedCanonicalGames: s.matchedCanonicalGames ?? 0,
    unmatchedGames: s.unmatchedGames ?? 0,
    userGamesToCreate: s.userGamesToCreate ?? 0,
    userGamesToUpdate: s.userGamesToUpdate ?? 0,
    warnings: plan?.warnings ?? [],
  };
}

// Re-exported for convenience so callers can default a new account's status
// without importing platforms.js directly.
export const DEFAULT_PLATFORM_ACCOUNT_STATUS = PLATFORM_ACCOUNT_STATUS.DISCONNECTED;
