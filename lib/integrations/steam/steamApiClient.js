// Real, SERVER-ONLY Steam Web API client (Phase 17).
//
// SECURITY:
// - Reads process.env.STEAM_API_KEY at call time. NEVER use NEXT_PUBLIC_*.
// - The key is never logged, never returned, and never included in thrown error
//   messages or in any URL surfaced to the caller (the key lives only in the
//   request query string, which is not exposed).
// - This module must only be imported by server-side route handlers.
//
// Allowed calls in this phase: GetPlayerSummaries (validation) and GetOwnedGames
// (library preview). No achievements, playtime enrichment, friends, reviews, or
// unofficial endpoints.

const STEAM_HOST = "https://api.steampowered.com";
const REQUEST_TIMEOUT_MS = 10000;

// Thrown when STEAM_API_KEY is not configured on the server → routes map to 503.
export class SteamConfigError extends Error {
  constructor(message = "Steam API key is not configured on the server.") {
    super(message);
    this.name = "SteamConfigError";
    this.code = "STEAM_NOT_CONFIGURED";
  }
}

// Thrown on a Steam API/network failure → routes map to a sanitized error.
export class SteamApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "SteamApiError";
    this.code = "STEAM_API_ERROR";
    this.status = status;
  }
}

/** True when a Steam API key is present in the server environment. */
export function isSteamConfigured() {
  return Boolean(process.env.STEAM_API_KEY);
}

function requireKey() {
  const key = process.env.STEAM_API_KEY;
  if (!key) throw new SteamConfigError();
  return key;
}

// Internal GET helper. Builds the authenticated URL (key in query), fetches with
// a timeout, and returns parsed JSON. On any failure it throws a SteamApiError
// whose message contains ONLY the HTTP status — never the URL or key.
async function steamGet(path, params) {
  const key = requireKey();
  const url = new URL(STEAM_HOST + path);
  url.searchParams.set("key", key);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
  } catch {
    // Do NOT include `url` (it carries the key) in the message.
    throw new SteamApiError("Steam API request failed (network or timeout).", 0);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new SteamApiError(`Steam API returned HTTP ${res.status}.`, res.status);
  }
  try {
    return await res.json();
  } catch {
    throw new SteamApiError("Steam API returned an unparseable response.", res.status);
  }
}

/**
 * GetPlayerSummaries — validate a Steam account and read public profile fields.
 * Returns the player summary object, or null if the id resolves to no player.
 */
export async function fetchSteamPlayerSummary(steamId64) {
  const json = await steamGet("/ISteamUser/GetPlayerSummaries/v0002/", { steamids: steamId64 });
  const players = json?.response?.players;
  return Array.isArray(players) && players.length > 0 ? players[0] : null;
}

/**
 * GetOwnedGames — the user's owned library. Returns the raw `response` object
 * ({ game_count, games }). Empty/private libraries return { game_count: 0, games: [] }.
 */
export async function fetchSteamOwnedGamesLive(steamId64) {
  const json = await steamGet("/IPlayerService/GetOwnedGames/v1/", {
    steamid: steamId64,
    include_appinfo: true,
    include_played_free_games: true,
    format: "json",
  });
  const response = json?.response ?? {};
  return {
    game_count: Number(response.game_count) || (Array.isArray(response.games) ? response.games.length : 0),
    games: Array.isArray(response.games) ? response.games : [],
  };
}

/**
 * Derive a coarse, safe profile-visibility label from communityvisibilitystate.
 * 3 = public; anything else is treated as private/limited.
 */
export function steamVisibilityLabel(summary) {
  return summary?.communityvisibilitystate === 3 ? "public" : "private";
}
