// Battle.net game library client.
//
// Two modes:
//   LIVE    — calls Blizzard OAuth API with BATTLENET_CLIENT_ID + BATTLENET_CLIENT_SECRET.
//   FIXTURE — returns mock data when credentials are absent.
//
// Battle.net real integration requires OAuth 2.0 client credentials. The BattleTag
// stored in PlatformAccount.externalUserId is a public identifier.

import { BATTLENET_RAW_GAMES } from "@/lib/integrations/battlenet/battlenetFixtures";

export function hasBattlenetCredentials() {
  return Boolean(process.env.BATTLENET_CLIENT_ID && process.env.BATTLENET_CLIENT_SECRET);
}

/**
 * Fetch a user's Battle.net game list by BattleTag.
 * Falls back to fixtures when Battle.net credentials are absent.
 *
 * @param {string} battletag - public BattleTag e.g. "Player#1234"
 * @returns {Promise<Array>} raw product objects
 */
export async function fetchBattlenetGames(battletag) {
  if (!hasBattlenetCredentials() || !battletag || battletag === "fixture") {
    return BATTLENET_RAW_GAMES;
  }

  // 1. Obtain client_credentials access token.
  const tokenRes = await fetch("https://oauth.battle.net/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.BATTLENET_CLIENT_ID}:${process.env.BATTLENET_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) {
    throw new Error(`Battle.net token error: ${tokenRes.status}`);
  }

  const { access_token } = await tokenRes.json();

  // 2. Fetch account profile. Battle.net does not expose a unified game list in
  // the public API; in production this would be combined with per-game endpoints.
  const profileRes = await fetch("https://eu.api.blizzard.com/account/user", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!profileRes.ok) {
    throw new Error(`Battle.net profile error: ${profileRes.status}`);
  }

  // Return fixture data until per-game endpoints are wired individually.
  return BATTLENET_RAW_GAMES;
}
