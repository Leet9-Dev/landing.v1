// Battle.net normalizer — maps raw Blizzard product objects to Leet9 normalized shape.

/**
 * @param {object} raw - one Battle.net game object from battlenetClient
 * @returns {object} normalized game record
 */
export function normalizeBattlenetGame(raw) {
  return {
    platform: "battlenet",
    externalId: String(raw.productId),
    externalTitle: raw.name || "Unknown",
    playtimeHours: null, // Battle.net API does not expose global playtime
    achievementsUnlocked: null,
    trophiesUnlocked: null,
    lastPlayedAt: raw.lastPlayedAt || null,
    canonicalGameId: null,
    matched: false,
  };
}

/** @param {Array} rawGames */
export function normalizeBattlenetGames(rawGames) {
  return rawGames.map(normalizeBattlenetGame);
}
