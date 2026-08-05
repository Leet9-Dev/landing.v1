// Ubisoft Connect game library client.
//
// Two modes:
//   LIVE    — calls Ubisoft's Demux/Connect API with UBISOFT_CLIENT_ID + UBISOFT_CLIENT_SECRET (OAuth 2.0).
//   FIXTURE — returns mock data when credentials are absent.
//
// Ubisoft's API requires OAuth 2.0 with per-user consent to access game libraries.
// The username stored in PlatformAccount.externalUserId is the public Ubisoft Connect username.
// Real integration requires per-user OAuth — fixture mode is used until that flow is wired.

import { UBISOFT_RAW_OWNED_GAMES } from "@/lib/integrations/ubisoft/ubisoftFixtures";

export function hasUbisoftCredentials() {
  return Boolean(process.env.UBISOFT_CLIENT_ID && process.env.UBISOFT_CLIENT_SECRET);
}

/**
 * Fetch a user's Ubisoft Connect game library by username.
 * Falls back to fixtures when Ubisoft credentials are absent.
 *
 * @param {string} username - Ubisoft Connect display name
 * @returns {Promise<Array>} raw Ubisoft game objects
 */
export async function fetchUbisoftGames(username) {
  if (!hasUbisoftCredentials() || !username || username === "fixture") {
    return UBISOFT_RAW_OWNED_GAMES;
  }

  // 1. Obtain client_credentials access token from Ubisoft's auth service.
  const tokenRes = await fetch(
    "https://public-ubiservices.ubi.com/v3/profiles/sessions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ubi-AppId": process.env.UBISOFT_CLIENT_ID,
        Authorization: `Basic ${Buffer.from(`${process.env.UBISOFT_CLIENT_ID}:${process.env.UBISOFT_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({ rememberMe: false }),
    }
  );

  if (!tokenRes.ok) {
    throw new Error(`Ubisoft auth error: ${tokenRes.status}`);
  }

  // Ubisoft's game library requires per-user OAuth consent — fixture until full OAuth is built.
  return UBISOFT_RAW_OWNED_GAMES;
}
