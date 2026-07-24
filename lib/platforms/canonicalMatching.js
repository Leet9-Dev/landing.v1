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
  return ["steam", "psn", "xbox", "riot", "battlenet", "epic", "gog", "itch", "ea"].filter((p) => set.has(p));
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
    result.set(gameId, ["steam", "psn", "xbox", "riot", "battlenet", "epic", "gog", "itch", "ea"].filter((p) => set.has(p)));
  }
  return result;
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
