// PSN → Leet9 normalization.
//
// Converts raw PSN trophy title objects (as returned by the PSN Trophy API)
// into the Leet9 normalized detected-game shape.
//
// Raw PSN fields used:
//   npCommunicationId   → externalId  (the PSN title ID matching GameExternalSource)
//   trophyTitleName     → externalTitle
//   earnedTrophies      → trophiesUnlocked (sum of all trophy types)
//   lastUpdatedDateTime → lastPlayedAt
//
// Fields intentionally absent:
//   playtimeHours: null — PSN Trophy API does not expose playtime
//   achievementsUnlocked: null — PSN uses trophies, not achievements

/**
 * Count total trophies earned across all trophy types.
 */
function sumEarnedTrophies(earned) {
  if (!earned) return null;
  return (earned.bronze ?? 0) + (earned.silver ?? 0) + (earned.gold ?? 0) + (earned.platinum ?? 0);
}

/**
 * Normalize one raw PSN trophy title into the Leet9 detected-game shape.
 *
 * @param {object} rawPsnTitle - one entry from the PSN Trophy API trophyTitles list
 * @returns {object} normalized detected game
 */
export function normalizePsnTitle(rawPsnTitle) {
  return {
    platform: "psn",
    externalId: rawPsnTitle.npCommunicationId ?? "",
    externalTitle: rawPsnTitle.trophyTitleName ?? "",
    playtimeHours: null,
    achievementsUnlocked: null,
    trophiesUnlocked: sumEarnedTrophies(rawPsnTitle.earnedTrophies),
    lastPlayedAt: rawPsnTitle.lastUpdatedDateTime ?? null,
    canonicalGameId: null,
    matched: false,
  };
}

/**
 * Normalize an array of raw PSN trophy titles.
 *
 * @param {Array} rawTitles - array from PSN trophyTitles response
 * @returns {Array} normalized detected games
 */
export function normalizePsnTitles(rawTitles) {
  return rawTitles.map(normalizePsnTitle);
}
