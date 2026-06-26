// Normalization helpers for the platform-agnostic ingestion flow.
//
// The required Leet9 flow is:
//   Connected Platform Account
//     -> Raw Detected Platform Game   (whatever the platform API returns)
//     -> Normalized Detected Game     (this file)
//     -> GameExternalSource           (platform externalId -> canonical gameId)
//     -> Canonical Game
//     -> UserGame
//     -> Discovery / Profile / Stats / Rankings
//
// Raw platform data must NEVER directly power Discovery/Profile/Stats/Rankings.
// It must first be normalized into Leet9-owned shapes like the ones below.

import { isSupportedPlatform } from "@/lib/platforms/platforms";

/**
 * Normalized detected game shape (documentation reference):
 *
 * {
 *   platform: "steam" | "psn",
 *   externalId: string,        // Steam appId or PSN titleId
 *   externalTitle: string,     // raw title as reported by the platform
 *   playtimeHours: number | null,
 *   achievementsUnlocked: number | null,
 *   trophiesUnlocked: number | null,
 *   lastPlayedAt: string | null,
 *   canonicalGameId: string | null, // resolved via GameExternalSource, null if unmatched
 *   matched: boolean,
 * }
 */

/** Normalize one raw detected platform game into the Leet9 detected-game shape. */
export function normalizeDetectedGame(raw, canonicalGameId = null) {
  const minutes = raw.playtimeMinutes ?? null;
  return {
    platform: raw.platform,
    externalId: String(raw.externalId),
    externalTitle: raw.externalTitle ?? "",
    playtimeHours: minutes != null ? Math.round((minutes / 60) * 10) / 10 : raw.playtimeHours ?? null,
    achievementsUnlocked: raw.achievementsUnlocked ?? null,
    trophiesUnlocked: raw.trophiesUnlocked ?? null,
    lastPlayedAt: raw.lastPlayedAt ?? null,
    canonicalGameId: canonicalGameId ?? null,
    matched: Boolean(canonicalGameId),
  };
}

/**
 * Normalized external source shape (GameExternalSource):
 *
 * {
 *   provider: "steam" | "psn",
 *   externalGameId: string,
 *   gameId: string,           // canonical Leet9 Game id
 *   externalTitle: string,
 * }
 */
export function normalizeExternalSource(raw) {
  return {
    provider: raw.platform ?? raw.provider,
    externalGameId: String(raw.externalId ?? raw.externalGameId),
    gameId: raw.gameId,
    externalTitle: raw.externalTitle ?? "",
  };
}

/** Guard: only keep detected games from providers Leet9 supports. */
export function isIngestibleDetectedGame(raw) {
  return Boolean(raw?.platform) && isSupportedPlatform(raw.platform);
}
