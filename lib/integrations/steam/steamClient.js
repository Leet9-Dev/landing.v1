// Steam Web API client.
//
// Real calls are made when STEAM_API_KEY is set in the environment.
// When the key is absent all functions fall back to fixture data so the
// rest of the codebase stays testable without credentials.
//
// Rate limits: 100k calls/day per key. Private Steam profiles return an
// empty game list (not an error) — callers should surface this to the user.

import { STEAM_RAW_API_RESPONSE } from "@/lib/integrations/steam/steamFixtures";

export const hasSteamApiKey = () => Boolean(process.env.STEAM_API_KEY);

/**
 * Fetch the owned game list for a Steam user.
 * Falls back to fixture data when STEAM_API_KEY is not set.
 *
 * @param {string} steamId64
 * @returns {Promise<Array>} raw Steam owned-game objects
 */
export async function fetchSteamOwnedGames(steamId64) {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return STEAM_RAW_API_RESPONSE.response.games;

  const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", steamId64);
  url.searchParams.set("include_appinfo", "true");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Steam GetOwnedGames error: ${res.status}`);
  const json = await res.json();
  return json.response?.games ?? [];
}

/**
 * Fetch a player's public profile summary.
 * Returns null when the account does not exist.
 * Throws when STEAM_API_KEY is not set.
 *
 * @param {string} steamId64
 * @returns {Promise<object|null>} player summary or null
 */
export async function fetchSteamPlayerSummaries(steamId64) {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error("STEAM_API_KEY is not set.");

  const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamids", steamId64);
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Steam GetPlayerSummaries error: ${res.status}`);
  const json = await res.json();
  const players = json.response?.players ?? [];
  return players[0] ?? null;
}

/**
 * Fetch achievement stats for one game. Returns null for private profiles
 * or games with no stats schema.
 *
 * @param {string} steamId64
 * @param {number} appId
 * @returns {Promise<object|null>}
 */
export async function fetchSteamAchievements(steamId64, appId) {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", steamId64);
  url.searchParams.set("appid", String(appId));
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const json = await res.json();
  return json.playerstats ?? null;
}
