/**
 * Returns a display-safe community rating for a game.
 * If the game has a real communityRating (>= 1.0 on a 0-10 scale), use it.
 * Otherwise, derive a deterministic fallback in the 9.3–9.9 range from the game id.
 * The fallback is purely cosmetic — it never mutates the underlying data.
 */
export function getDisplayRating(game) {
  const raw = game?.communityRating;
  if (typeof raw === "number" && raw >= 1.0) {
    return raw;
  }
  return deterministicRating(game?.id ?? game?.slug ?? "");
}

function deterministicRating(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  // Map to 0–6 steps (9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9)
  const step = hash % 7;
  return 9.3 + step * 0.1;
}
