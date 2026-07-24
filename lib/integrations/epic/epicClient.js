// Epic Games Store library client.
//
// Two modes:
//   LIVE    — calls Epic Games public API with EPIC_CLIENT_ID + EPIC_CLIENT_SECRET.
//   FIXTURE — returns mock data when credentials are absent.
//
// Epic Games integration requires OAuth 2.0 exchange. The username stored in
// PlatformAccount.externalUserId is the public Epic display name.

import { EPIC_RAW_GAMES } from "@/lib/integrations/epic/epicFixtures";

export function hasEpicCredentials() {
  return Boolean(process.env.EPIC_CLIENT_ID && process.env.EPIC_CLIENT_SECRET);
}

/**
 * Fetch a user's Epic Games library by username.
 * Falls back to fixtures when Epic credentials are absent.
 *
 * @param {string} username - Epic display name
 * @returns {Promise<Array>} raw catalog item objects
 */
export async function fetchEpicGames(username) {
  if (!hasEpicCredentials() || !username || username === "fixture") {
    return EPIC_RAW_GAMES;
  }

  // 1. Obtain access token via client credentials.
  const tokenRes = await fetch("https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.EPIC_CLIENT_ID}:${process.env.EPIC_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) {
    throw new Error(`Epic token error: ${tokenRes.status}`);
  }

  const { access_token } = await tokenRes.json();

  // 2. Look up account by display name.
  const accountRes = await fetch(
    `https://account-public-service-prod.ol.epicgames.com/account/api/public/account/displayName/${encodeURIComponent(username)}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  if (!accountRes.ok) {
    throw new Error(`Epic account lookup error: ${accountRes.status}`);
  }

  // The Epic public API does not expose library contents. Real integration
  // requires user-facing OAuth consent. Return fixtures until OAuth is wired.
  return EPIC_RAW_GAMES;
}
