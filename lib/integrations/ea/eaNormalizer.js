// EA App game normalizer — maps raw EA product objects to Leet9 normalized shape.

/**
 * @param {object} raw - one EA game object from eaClient
 * @returns {object} normalized game record
 */
export function normalizeEaGame(raw) {
  return {
    platform: "ea",
    externalId: String(raw.productId),
    externalTitle: raw.displayName || "Unknown",
    playtimeHours: null,
    achievementsUnlocked: null,
    trophiesUnlocked: null,
    lastPlayedAt: raw.lastPlayedAt || null,
    canonicalGameId: null,
    matched: false,
  };
}

/** @param {Array} rawGames */
export function normalizeEaGames(rawGames) {
  return rawGames.map(normalizeEaGame);
}
