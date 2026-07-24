// GOG game library client.
//
// Two modes:
//   LIVE    — calls GOG public embed API (no key needed for public profiles).
//   FIXTURE — returns mock data when username is absent or GOG API is unreachable.
//
// GOG exposes a semi-public API for user profiles set to public:
//   https://embed.gog.com/user/{username}/games
// No developer API key required; only works for public profiles.

import { GOG_RAW_OWNED_GAMES } from "@/lib/integrations/gog/gogFixtures";

export function hasGogApiAccess() {
  // GOG public API requires no key, but can be toggled off via env.
  return process.env.GOG_API_ENABLED !== "false";
}

/**
 * Fetch a user's GOG library by username.
 * Falls back to fixtures when API is disabled or username is absent.
 *
 * @param {string} username - public GOG username
 * @returns {Promise<Array>} raw GOG game objects
 */
export async function fetchGogOwnedGames(username) {
  if (!hasGogApiAccess() || !username || username === "fixture") {
    return GOG_RAW_OWNED_GAMES;
  }

  const res = await fetch(
    `https://embed.gog.com/users/${encodeURIComponent(username)}/games`,
    { headers: { "User-Agent": "Leet9/1.0" } }
  );

  if (!res.ok) {
    // Private profile or user not found — fall back to fixtures gracefully.
    if (res.status === 404 || res.status === 403) return GOG_RAW_OWNED_GAMES;
    throw new Error(`GOG API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.owned ?? GOG_RAW_OWNED_GAMES;
}
