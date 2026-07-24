// GOG game normalizer — maps raw GOG product objects to Leet9 normalized shape.

/**
 * @param {object} raw - one GOG product object from gogClient
 * @returns {object} normalized game record
 */
export function normalizeGogGame(raw) {
  return {
    platform: "gog",
    externalId: String(raw.id),
    externalTitle: raw.title || "Unknown",
    playtimeHours: null, // GOG public API does not expose playtime
    achievementsUnlocked: typeof raw.achievementsUnlocked === "number" ? raw.achievementsUnlocked : null,
    trophiesUnlocked: null,
    lastPlayedAt: null,
    canonicalGameId: null,
    matched: false,
  };
}

/** @param {Array} rawGames */
export function normalizeGogGames(rawGames) {
  return rawGames.map(normalizeGogGame);
}
