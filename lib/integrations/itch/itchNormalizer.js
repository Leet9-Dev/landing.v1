// itch.io game normalizer — maps raw itch.io game objects to Leet9 normalized shape.

/**
 * @param {object} raw - one itch.io game object from itchClient
 * @returns {object} normalized game record
 */
export function normalizeItchGame(raw) {
  return {
    platform: "itch",
    externalId: String(raw.id),
    externalTitle: raw.title || "Unknown",
    playtimeHours: null,
    achievementsUnlocked: null,
    trophiesUnlocked: null,
    lastPlayedAt: null,
    canonicalGameId: null,
    matched: false,
  };
}

/** @param {Array} rawGames */
export function normalizeItchGames(rawGames) {
  return rawGames.map(normalizeItchGame);
}
