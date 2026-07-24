// itch.io game library client.
//
// Two modes:
//   LIVE    — calls itch.io API with ITCH_API_KEY (per-user key from itch.io settings).
//   FIXTURE — returns mock data when no key is configured.
//
// itch.io API key: https://itch.io/user/settings/api-keys
// The username stored in PlatformAccount.externalUserId is the public identifier.

import { ITCH_RAW_OWNED_GAMES } from "@/lib/integrations/itch/itchFixtures";

export function hasItchApiKey() {
  return Boolean(process.env.ITCH_API_KEY);
}

/**
 * Fetch a user's itch.io game library.
 * Falls back to fixtures when ITCH_API_KEY is absent.
 *
 * @param {string} username - itch.io username (stored as externalUserId)
 * @returns {Promise<Array>} raw itch.io game objects
 */
export async function fetchItchOwnedGames(username) {
  if (!hasItchApiKey() || !username || username === "fixture") {
    return ITCH_RAW_OWNED_GAMES;
  }

  const res = await fetch(
    `https://itch.io/api/1/${encodeURIComponent(process.env.ITCH_API_KEY)}/my-games`,
    { headers: { "User-Agent": "Leet9/1.0" } }
  );

  if (!res.ok) {
    throw new Error(`itch.io API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.games ?? [];
}
