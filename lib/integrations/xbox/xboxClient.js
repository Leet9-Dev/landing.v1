// Xbox Live game library client.
//
// Two modes:
//   LIVE    — calls Xbox API with XBOX_API_KEY (Microsoft OpenXBL or first-party key).
//   FIXTURE — returns mock data when no API key is configured.
//
// Real Xbox integration requires Microsoft OAuth + an XBL/OpenXBL API key.
// The Gamertag stored in PlatformAccount.externalUserId is a public identifier.

import { XBOX_RAW_OWNED_GAMES } from "@/lib/integrations/xbox/xboxFixtures";

export function hasXboxApiKey() {
  return Boolean(process.env.XBOX_API_KEY);
}

/**
 * Fetch a user's Xbox title list by Gamertag.
 * Falls back to fixtures when XBOX_API_KEY is absent.
 *
 * @param {string} gamertag - public Xbox Gamertag
 * @returns {Promise<Array>} raw Xbox title objects
 */
export async function fetchXboxOwnedGames(gamertag) {
  if (!hasXboxApiKey() || !gamertag || gamertag === "fixture") {
    return XBOX_RAW_OWNED_GAMES;
  }

  const res = await fetch(
    `https://xbl.io/api/v2/player/titleHistory?gamertag=${encodeURIComponent(gamertag)}`,
    {
      headers: {
        "x-authorization": process.env.XBOX_API_KEY,
        "Accept-Language": "en-US",
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Xbox API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.titles ?? [];
}
