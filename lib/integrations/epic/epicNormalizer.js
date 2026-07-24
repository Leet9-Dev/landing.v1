// Epic Games normalizer — maps raw Epic catalog item objects to Leet9 normalized shape.

/**
 * @param {object} raw - one Epic catalog item from epicClient
 * @returns {object} normalized game record
 */
export function normalizeEpicGame(raw) {
  return {
    platform: "epic",
    externalId: String(raw.catalogItemId),
    externalTitle: raw.title || "Unknown",
    playtimeHours: null, // Epic public API does not expose playtime
    achievementsUnlocked: null,
    trophiesUnlocked: null,
    lastPlayedAt: raw.lastPlayedAt || null,
    canonicalGameId: null,
    matched: false,
  };
}

/** @param {Array} rawGames */
export function normalizeEpicGames(rawGames) {
  return rawGames.map(normalizeEpicGame);
}
