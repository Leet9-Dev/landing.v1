// Ubisoft Connect game normalizer — maps raw Ubisoft space objects to Leet9 shape.

/**
 * @param {object} raw - one Ubisoft game object from ubisoftClient
 * @returns {object} normalized game record
 */
export function normalizeUbisoftGame(raw) {
  return {
    platform: "ubisoft",
    externalId: String(raw.spaceId),
    externalTitle: raw.name || "Unknown",
    playtimeHours: raw.playtimeMinutes != null ? Math.round(raw.playtimeMinutes / 60 * 10) / 10 : null,
    achievementsUnlocked: null,
    trophiesUnlocked: null,
    lastPlayedAt: raw.lastPlayedAt || null,
    canonicalGameId: null,
    matched: false,
  };
}

/** @param {Array} rawGames */
export function normalizeUbisoftGames(rawGames) {
  return rawGames.map(normalizeUbisoftGame);
}
