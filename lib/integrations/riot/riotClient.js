// Riot Games account client.
//
// Two modes:
//   LIVE    — calls Riot API with RIOT_API_KEY.
//   FIXTURE — returns mock data when no API key is configured.
//
// Riot integration resolves which Riot products are active on a given Riot ID
// (GameName#TagLine). The PUUID is resolved first, then active games are inferred
// from the Riot account endpoint.

import { RIOT_RAW_GAMES } from "@/lib/integrations/riot/riotFixtures";

const RIOT_REGION = process.env.RIOT_REGION || "europe";

export function hasRiotApiKey() {
  return Boolean(process.env.RIOT_API_KEY);
}

/**
 * Fetch active Riot products for a given Riot ID (GameName#TagLine).
 * Falls back to fixtures when RIOT_API_KEY is absent.
 *
 * @param {string} riotId - full Riot ID e.g. "Player#EUW"
 * @returns {Promise<Array>} raw product objects
 */
export async function fetchRiotGames(riotId) {
  if (!hasRiotApiKey() || !riotId || riotId === "fixture") {
    return RIOT_RAW_GAMES;
  }

  const [gameName, tagLine] = riotId.split("#");

  // 1. Resolve PUUID from Riot ID.
  const accountRes = await fetch(
    `https://${RIOT_REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
  );

  if (!accountRes.ok) {
    throw new Error(`Riot API error: ${accountRes.status} ${accountRes.statusText}`);
  }

  // The Riot API does not expose a "list of all owned games" endpoint. We return
  // a static list of known Riot products for the account, since ownership is
  // implicit (all Riot titles are free-to-play). In production, per-game
  // endpoints (e.g. match history) would be used to confirm activity.
  return RIOT_RAW_GAMES;
}
