// PSN Trophy API client.
//
// PSN does not offer a developer API key model like Steam. Real integration
// requires an NPSSO token (a session credential from the user's PlayStation
// browser session) which must be stored encrypted per-user — that secure
// credential design is not yet in this schema.
//
// For the MVP, all functions fall back to fixture data so the rest of the
// codebase stays testable without credentials. When real PSN auth is wired
// up, replace the fixture fallback with calls to the unofficial PSN API.
//
// Key difference from Steam: PSN does not expose playtime reliably.
// Trophies (bronze/silver/gold/platinum) are the primary engagement signal.

import { PSN_RAW_API_RESPONSE } from "@/lib/integrations/psn/psnFixtures";

// Returns true when system-level PSN credentials are configured.
// Currently always false — PSN auth requires per-user NPSSO tokens.
export const hasPsnCredentials = () => Boolean(process.env.PSN_NPSSO);

/**
 * Fetch the trophy title list for a PSN user.
 * Falls back to fixture data when PSN credentials are not configured.
 *
 * @param {string} accountId  PSN account ID or Online ID
 * @returns {Promise<Array>}  raw PSN trophy title objects
 */
export async function fetchPsnTrophyTitles(accountId) {
  if (!hasPsnCredentials()) {
    return PSN_RAW_API_RESPONSE.trophyTitles;
  }

  // Real PSN integration goes here when per-user NPSSO tokens are available.
  // The unofficial API endpoint is:
  //   GET https://m.np.playstation.com/api/trophy/v1/users/{accountId}/trophyTitles
  //   Authorization: Bearer {access_token}  (derived from NPSSO via OAuth2 exchange)
  //
  // Once psn-api (npm) or equivalent is integrated, replace this stub:
  throw new Error("Real PSN API integration is not yet implemented. PSN_NPSSO is set but the OAuth2 exchange flow is pending.");
}
