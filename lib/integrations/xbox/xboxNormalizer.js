// Xbox game normalizer — maps raw Xbox title objects to Leet9 normalized shape.

/**
 * @param {object} raw - one Xbox title object from xboxClient
 * @returns {object} normalized game record
 */
export function normalizeXboxGame(raw) {
  const minutesPlayed = typeof raw.minutesPlayed === "number" ? raw.minutesPlayed : 0;
  return {
    platform: "xbox",
    externalId: String(raw.titleId),
    externalTitle: raw.name || "Unknown",
    playtimeHours: minutesPlayed > 0 ? Math.round((minutesPlayed / 60) * 10) / 10 : null,
    achievementsUnlocked: typeof raw.currentGamerscore === "number" ? raw.currentGamerscore : null,
    trophiesUnlocked: null,
    lastPlayedAt: raw.lastTimePlayed || null,
    canonicalGameId: null,
    matched: false,
  };
}

/** @param {Array} rawGames */
export function normalizeXboxGames(rawGames) {
  return rawGames.map(normalizeXboxGame);
}
