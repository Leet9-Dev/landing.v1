// EA App game library client.
//
// Two modes:
//   LIVE    — calls EA Nucleus API with EA_CLIENT_ID + EA_CLIENT_SECRET (OAuth 2.0).
//   FIXTURE — returns mock data when credentials are absent.
//
// EA's official API requires Nucleus OAuth. The username stored in
// PlatformAccount.externalUserId is the public EA display name.
// Real integration requires per-user OAuth consent — fixture mode is used
// until the EA OAuth flow is wired.

import { EA_RAW_OWNED_GAMES } from "@/lib/integrations/ea/eaFixtures";

export function hasEaCredentials() {
  return Boolean(process.env.EA_CLIENT_ID && process.env.EA_CLIENT_SECRET);
}

/**
 * Fetch a user's EA App game library by username.
 * Falls back to fixtures when EA credentials are absent.
 *
 * @param {string} username - EA display name / Origin ID
 * @returns {Promise<Array>} raw EA game objects
 */
export async function fetchEaGames(username) {
  if (!hasEaCredentials() || !username || username === "fixture") {
    return EA_RAW_OWNED_GAMES;
  }

  // 1. Obtain client_credentials access token from EA's Nucleus auth service.
  const tokenRes = await fetch(
    "https://accounts.ea.com/connect/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.EA_CLIENT_ID}:${process.env.EA_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&release_type=prod",
    }
  );

  if (!tokenRes.ok) {
    throw new Error(`EA auth error: ${tokenRes.status}`);
  }

  // EA's game library endpoint requires per-user OAuth — real integration
  // returns fixtures until the full OAuth flow is implemented.
  return EA_RAW_OWNED_GAMES;
}
