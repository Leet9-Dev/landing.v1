// Client-safe billing utilities (no Stripe SDK import)

export function makeComparisonKey(steamId1, steamId2) {
  return [steamId1, steamId2].sort().join(":");
}
