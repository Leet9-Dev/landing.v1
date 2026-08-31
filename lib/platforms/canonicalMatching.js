// Canonical game matching helpers.
//
// Core product rule: Steam and PSN versions of the same title must map to ONE
// canonical Leet9 Game, and that game must appear only ONCE in Discovery with
// badges for every platform it was detected on.
//
// These helpers operate purely on GameExternalSource records (the normalized
// platform externalId -> canonical gameId mapping). They never read raw
// platform data directly.

/**
 * Resolve a detected (platform, externalId) pair to a canonical gameId using
 * the external-source records. Returns null when no match exists yet — such
 * games should enter a future review/matching queue rather than Discovery.
 */
export function matchDetectedGameToCanonical(platform, externalId, externalSources) {
  const id = String(externalId);
  const match = externalSources.find(
    (s) => s.platform === platform && String(s.externalId) === id
  );
  return match ? match.gameId : null;
}

/**
 * Derive the full set of source platforms for a canonical game from its
 * external-source records, ordered steam-first then psn. This is the single
 * source of truth for Discovery's platform badges.
 */
export function deriveSourcePlatforms(gameId, externalSources) {
  const set = new Set(
    externalSources.filter((s) => s.gameId === gameId).map((s) => s.platform)
  );
  return ["steam", "psn", "xbox", "riot", "battlenet", "epic", "gog", "itch", "ea", "ubisoft", "twitch", "discord"].filter((p) => set.has(p));
}

/**
 * Build a Map of canonical gameId -> sourcePlatforms[] from external sources.
 * Useful for joining onto a canonical games list without N lookups.
 */
export function buildSourcePlatformMap(externalSources) {
  const map = new Map();
  for (const s of externalSources) {
    if (!map.has(s.gameId)) map.set(s.gameId, new Set());
    map.get(s.gameId).add(s.platform);
  }
  const result = new Map();
  for (const [gameId, set] of map) {
    result.set(gameId, ["steam", "psn", "xbox", "riot", "battlenet", "epic", "gog", "itch", "ea", "ubisoft", "twitch", "discord"].filter((p) => set.has(p)));
  }
  return result;
}

/**
 * Title-based fallback: find a canonical gameId by normalizing and comparing
 * the detected game title against MOCK_GAMES canonicalTitle values.
 * Used when an exact platform/externalId match fails (e.g. PSN game not yet
 * in external-source mapping).
 *
 * @param {string} title - raw title from the platform (e.g. PSN trophyTitleName)
 * @param {Array}  games - canonical game records (must have .id and .canonicalTitle)
 * @returns {string|null} canonical gameId, or null if no confident match
 */
export function matchDetectedGameByTitle(title, games) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const needle = norm(title);
  if (!needle) return null;
  const exact = games.find((g) => norm(g.canonicalTitle) === needle);
  if (exact) return exact.id;
  // Substring match — only when both are ≥ 5 chars to avoid false positives.
  if (needle.length >= 5) {
    const sub = games.find((g) => {
      const hay = norm(g.canonicalTitle);
      return hay.length >= 5 && (hay.includes(needle) || needle.includes(hay));
    });
    if (sub) return sub.id;
  }
  return null;
}

/**
 * Collapse a list of detected games into the set of unique canonical gameIds
 * they map to (matched only). Guarantees no duplicate canonical games — the
 * same title detected on both Steam and PSN collapses to one id.
 */
export function uniqueCanonicalGameIds(detectedGames) {
  const ids = new Set();
  for (const d of detectedGames) {
    if (d.canonicalGameId) ids.add(d.canonicalGameId);
  }
  return [...ids];
}
