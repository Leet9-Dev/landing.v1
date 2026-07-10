// Steam → Leet9 normalization.
//
// Converts raw Steam owned-game objects (as returned by GetOwnedGames) into
// the Leet9 normalized detected-game shape defined in lib/platforms/normalization.js.
//
// Raw Steam fields used:
//   appid               → externalId
//   name                → externalTitle
//   playtime_forever    → playtimeHours  (Steam reports minutes)
//   rtime_last_played   → lastPlayedAt   (Unix timestamp, 0 means never/unknown)
//   has_community_visible_stats → hint for whether achievement sync is possible
//
// Fields we intentionally leave for later:
//   img_icon_url        → useful for UI but not part of the normalized shape yet
//   playtime_2weeks     → useful for "active recently" signals but deferred

/**
 * Normalize one raw Steam owned-game object into the Leet9 detected-game shape.
 * canonicalGameId and matched are resolved by the sync planner, not here.
 *
 * @param {object} rawSteamGame - one entry from Steam's GetOwnedGames response
 * @returns {object} normalized detected game
 */
export function normalizeSteamGame(rawSteamGame) {
  const minutes = rawSteamGame.playtime_forever ?? 0;
  const lastPlayedUnix = rawSteamGame.rtime_last_played ?? 0;

  return {
    platform: "steam",
    externalId: String(rawSteamGame.appid),
    externalTitle: rawSteamGame.name ?? "",
    playtimeHours: Math.round((minutes / 60) * 10) / 10,
    achievementsUnlocked: null, // populated later via GetPlayerAchievements
    trophiesUnlocked: null,     // Steam does not have trophies
    lastPlayedAt: lastPlayedUnix > 0
      ? new Date(lastPlayedUnix * 1000).toISOString()
      : null,
    canonicalGameId: null,  // resolved by sync planner
    matched: false,         // resolved by sync planner
  };
}

/**
 * Normalize an array of raw Steam games.
 *
 * @param {Array} rawGames - array from Steam GetOwnedGames response
 * @returns {Array} normalized detected games
 */
export function normalizeSteamGames(rawGames) {
  return rawGames.map(normalizeSteamGame);
}

/**
 * Extract only the fields the Leet9 ingestion pipeline needs from a raw Steam
 * game, without full normalization. Useful for logging/auditing raw inputs.
 */
export function extractSteamGameKey(rawSteamGame) {
  return {
    appid: rawSteamGame.appid,
    name: rawSteamGame.name,
    playtime_forever: rawSteamGame.playtime_forever,
  };
}

// A sanitized whitelist of the raw Steam game fields worth keeping for audit.
// Deliberately excludes anything unnecessary; none of these are secrets.
function sanitizeRawSteamGame(g) {
  return {
    appid: g.appid,
    name: typeof g.name === "string" ? g.name : null,
    playtime_forever: Number(g.playtime_forever) || 0,
    playtime_2weeks: Number(g.playtime_2weeks) || 0,
    rtime_last_played: Number(g.rtime_last_played) || 0,
    has_community_visible_stats: Boolean(g.has_community_visible_stats),
  };
}

/**
 * PURE normalizer for persistence (Phase 17). Converts a Steam GetOwnedGames
 * `response` (or a raw games array) into records shaped for PlatformDetectedGame.
 * No API calls, no DB — unit-testable in isolation.
 *
 * Handles: empty library, missing/invalid appids (skipped), missing names
 * (fallback title), and duplicate appids (deduped, first wins).
 *
 * @param {object|Array} response - Steam `response` object or a games array
 * @returns {{ games: Array, total: number, skipped: number }}
 */
export function normalizeOwnedGamesResponse(response) {
  const rawGames = Array.isArray(response?.games)
    ? response.games
    : Array.isArray(response)
      ? response
      : [];

  const seen = new Set();
  const games = [];
  let skipped = 0;

  for (const g of rawGames) {
    const appid = g?.appid;
    // appid is the canonical external identifier for this phase — required.
    if (appid == null || !Number.isFinite(Number(appid))) {
      skipped++;
      continue;
    }
    const externalGameId = String(appid);
    if (seen.has(externalGameId)) continue; // dedupe by appid
    seen.add(externalGameId);

    const minutes = Number(g.playtime_forever) || 0;
    const lastUnix = Number(g.rtime_last_played) || 0;
    const title =
      typeof g.name === "string" && g.name.trim() ? g.name.trim() : `App ${externalGameId}`;

    games.push({
      provider: "steam",
      externalGameId,
      externalTitle: title,
      playtimeHours: Math.round((minutes / 60) * 10) / 10,
      playtimeMinutes: minutes,
      lastPlayedAt: lastUnix > 0 ? new Date(lastUnix * 1000).toISOString() : null,
      raw: sanitizeRawSteamGame(g),
    });
  }

  return { games, total: games.length, skipped };
}
