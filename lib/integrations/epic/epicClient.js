// Epic Games Store library client.
//
// Two modes:
//   LIVE    — calls Epic library API with the user's OAuth access token.
//   FIXTURE — returns mock data when no access token is available.
//
// Epic's library endpoint (unofficial but stable):
//   GET https://library-service.live.use1a.on.epicgames.com/library/api/public/items/slim
// Returns records with { catalogItemId, appName, namespace, sandboxId }.
// Titles require a separate catalog lookup; appName is used as the display title.

import { EPIC_RAW_GAMES } from "@/lib/integrations/epic/epicFixtures";

export function hasEpicCredentials() {
  return Boolean(process.env.EPIC_CLIENT_ID && process.env.EPIC_CLIENT_SECRET);
}

/**
 * Fetch a user's Epic Games library.
 * Accepts either a legacy { username } param (fixture fallback) or
 * the full { accountId, accessToken } from OAuth.
 *
 * @param {object} params
 * @param {string} [params.username]     - legacy: Epic display name (fixture mode)
 * @param {string} [params.accountId]   - Epic account ID (OAuth mode)
 * @param {string} [params.accessToken] - user OAuth token (OAuth mode)
 * @returns {Promise<Array>} raw catalog item objects
 */
export async function fetchEpicGames({ username, accountId, accessToken } = {}) {
  // Fixture mode when no user token is available.
  if (!accessToken || accessToken === "fixture") {
    return EPIC_RAW_GAMES;
  }

  try {
    const libraryRes = await fetch(
      "https://library-service.live.use1a.on.epicgames.com/library/api/public/items/slim",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!libraryRes.ok) {
      console.error("Epic library API error:", libraryRes.status);
      return EPIC_RAW_GAMES;
    }

    const data = await libraryRes.json();
    const records = data.records ?? [];

    // Map to the same shape as fixtures so the normalizer works unchanged.
    return records.map((r) => ({
      catalogItemId: r.appName || r.catalogItemId,
      title: r.appName || r.catalogItemId,
      minutesPlayed: null,
      lastPlayedAt: null,
    }));
  } catch (err) {
    console.error("Epic library fetch error:", err);
    return EPIC_RAW_GAMES;
  }
}
