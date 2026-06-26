// Steam Web API client boundary.
//
// This file defines the interface for real Steam API calls. No real API calls
// are made here yet — all functions throw or return dry-run data. This boundary
// exists so the rest of the codebase can be written against a stable interface
// before the real client is wired up.
//
// Before activating real sync:
//   1. Add STEAM_API_KEY to Vercel env vars (never commit it).
//   2. Decide on Steam ID resolution: via NextAuth Steam login token (steamid64
//      is available in the JWT) or via user-provided vanity URL lookup.
//   3. Handle Steam profile visibility: public library required; private profiles
//      return 403 or empty game list — surface this to the user.
//   4. Respect Steam Web API rate limits (100k calls/day per key).
//   5. Add retry logic with exponential backoff for 429/503 responses.
//   6. Store raw responses for auditability before normalizing.
//
// Real endpoints this client will call:
//   GetOwnedGames:
//     GET https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/
//       ?key={STEAM_API_KEY}&steamid={steamid64}&include_appinfo=true&format=json
//
//   GetPlayerAchievements (per game):
//     GET https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/
//       ?key={STEAM_API_KEY}&steamid={steamid64}&appid={appid}&format=json

import { STEAM_RAW_API_RESPONSE } from "@/lib/integrations/steam/steamFixtures";

const DRY_RUN = true; // flip to false when real sync is ready

/**
 * Fetch the owned game list for a Steam user.
 * In dry-run mode returns fixture data; in real mode calls the Steam Web API.
 *
 * @param {string} steamId64 - The user's 64-bit Steam ID
 * @returns {Promise<Array>} raw Steam owned game objects
 */
export async function fetchSteamOwnedGames(steamId64) {
  if (DRY_RUN) {
    return STEAM_RAW_API_RESPONSE.response.games;
  }

  // Real implementation (not active):
  // const apiKey = process.env.STEAM_API_KEY;
  // if (!apiKey) throw new Error("STEAM_API_KEY env var not set");
  // const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`
  //   + `?key=${apiKey}&steamid=${steamId64}&include_appinfo=true&format=json`;
  // const res = await fetch(url);
  // if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  // const json = await res.json();
  // return json.response?.games ?? [];

  throw new Error("Real Steam sync is not active. Set DRY_RUN=false only after env/persistence is ready.");
}

/**
 * Fetch achievement stats for one game.
 * In dry-run mode returns null (not yet implemented for fixtures).
 *
 * @param {string} steamId64
 * @param {number} appId
 * @returns {Promise<object|null>}
 */
export async function fetchSteamAchievements(steamId64, appId) {
  if (DRY_RUN) {
    return null; // achievements sync is a follow-up to owned-game sync
  }

  // Real implementation (not active):
  // const apiKey = process.env.STEAM_API_KEY;
  // const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/`
  //   + `?key=${apiKey}&steamid=${steamId64}&appid=${appId}&format=json`;
  // const res = await fetch(url);
  // if (!res.ok) return null; // game may have no stats
  // const json = await res.json();
  // return json.playerstats ?? null;

  throw new Error("Real Steam achievements sync is not active.");
}

export { DRY_RUN };
