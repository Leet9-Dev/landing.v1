// Riot Games normalizer — maps raw Riot product objects to Leet9 normalized shape.

/**
 * @param {object} raw - one Riot game/product object from riotClient
 * @returns {object} normalized game record
 */
export function normalizeRiotGame(raw) {
  return {
    platform: "riot",
    externalId: String(raw.productId),
    externalTitle: raw.name || "Unknown",
    playtimeHours: null, // Riot API does not expose playtime
    achievementsUnlocked: null,
    trophiesUnlocked: null,
    lastPlayedAt: raw.lastPlayedAt || null,
    canonicalGameId: null,
    matched: false,
  };
}

/** @param {Array} rawGames */
export function normalizeRiotGames(rawGames) {
  return rawGames.map(normalizeRiotGame);
}
