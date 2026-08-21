// Riot Games account client.
//
// Two modes:
//   LIVE    — calls Riot API with RIOT_API_KEY.
//   FIXTURE — returns mock data when no API key is configured.
//
// Flow:
//   1. Resolve PUUID from Riot ID (GameName#TagLine).
//   2. Check LoL + TFT match history in parallel to confirm real activity.
//   3. Include Valorant always (F2P, Valorant API requires production key).
//   4. Return only games with confirmed activity (or all fixtures when no key).

import { RIOT_RAW_GAMES } from "@/lib/integrations/riot/riotFixtures";

const RIOT_REGION = process.env.RIOT_REGION || "europe";
const RIOT_TOKEN_HEADER = { "X-Riot-Token": process.env.RIOT_API_KEY };

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
    { headers: RIOT_TOKEN_HEADER }
  );

  if (!accountRes.ok) {
    throw new Error(`Riot account lookup failed: ${accountRes.status} ${accountRes.statusText}`);
  }

  const { puuid } = await accountRes.json();

  // 2. Check LoL and TFT activity in parallel via match history.
  //    One match ID is enough to confirm the player is active on that title.
  const [lolLastPlayed, tftLastPlayed] = await Promise.all([
    fetchLastMatchTimestamp(puuid, "lol"),
    fetchLastMatchTimestamp(puuid, "tft"),
  ]);

  const games = [];

  if (lolLastPlayed !== null) {
    games.push({
      productId: "league_of_legends",
      name: "League of Legends",
      hoursPlayed: null,
      lastPlayedAt: lolLastPlayed,
    });
  }

  if (tftLastPlayed !== null) {
    games.push({
      productId: "teamfight_tactics",
      name: "Teamfight Tactics",
      hoursPlayed: null,
      lastPlayedAt: tftLastPlayed,
    });
  }

  // Valorant match API requires a production Riot key — include if the account
  // exists (all Riot titles are F2P, PUUID confirms an active Riot account).
  games.push({
    productId: "valorant",
    name: "Valorant",
    hoursPlayed: null,
    lastPlayedAt: null,
  });

  return games;
}

/**
 * Returns the ISO timestamp of the most recent match for the given game,
 * or null if the player has no recorded matches.
 *
 * @param {string} puuid
 * @param {"lol"|"tft"} game
 * @returns {Promise<string|null>}
 */
async function fetchLastMatchTimestamp(puuid, game) {
  const matchListPath =
    game === "lol"
      ? `lol/match/v5/matches/by-puuid/${puuid}/ids?count=1`
      : `tft/match/v1/matches/by-puuid/${puuid}/ids?count=1`;

  try {
    const listRes = await fetch(
      `https://${RIOT_REGION}.api.riotgames.com/${matchListPath}`,
      { headers: RIOT_TOKEN_HEADER }
    );

    if (!listRes.ok) return null;

    const matchIds = await listRes.json();
    if (!Array.isArray(matchIds) || matchIds.length === 0) return null;

    // Fetch match detail to get the end timestamp.
    const detailPath =
      game === "lol"
        ? `lol/match/v5/matches/${matchIds[0]}`
        : `tft/match/v1/matches/${matchIds[0]}`;

    const detailRes = await fetch(
      `https://${RIOT_REGION}.api.riotgames.com/${detailPath}`,
      { headers: RIOT_TOKEN_HEADER }
    );

    if (!detailRes.ok) return new Date().toISOString();

    const detail = await detailRes.json();
    const ts = detail.info?.gameEndTimestamp ?? detail.info?.game_datetime;
    return ts ? new Date(ts).toISOString() : new Date().toISOString();
  } catch {
    return null;
  }
}
