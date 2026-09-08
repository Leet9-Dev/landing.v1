// Battle.net game detection client.
//
// Uses the user's OAuth access_token (stored in PlatformAccount.metadata after connect)
// to query Blizzard APIs and detect which games the account owns/has played.
//
// Detected games:
//   - Overwatch 2    : always included (free-to-play)
//   - World of Warcraft : /profile/user/wow (wow.profile scope)
//   - StarCraft II   : /sc2/profile/user (sc2.profile scope)
//   - Diablo IV      : /d4/{locale}/profile/{accountId}/hero (user token)
//
// Falls back to fixture data when no access_token is present or credentials are unconfigured.

import { BATTLENET_RAW_GAMES } from "@/lib/integrations/battlenet/battlenetFixtures";

const DEFAULT_REGION = process.env.BATTLENET_REGION || "eu";

export function hasBattlenetCredentials() {
  return Boolean(process.env.BATTLENET_CLIENT_ID && process.env.BATTLENET_CLIENT_SECRET);
}

/**
 * @param {{ battletag?: string, accountId?: string, accessToken?: string, region?: string }} opts
 * @returns {Promise<Array>} raw game objects shaped like BATTLENET_RAW_GAMES
 */
export async function fetchBattlenetGames({ battletag, accountId, accessToken, region } = {}) {
  const r = region || DEFAULT_REGION;

  // No user token — return fixtures for dry-run/demo.
  if (!accessToken || accessToken === "fixture") {
    return BATTLENET_RAW_GAMES;
  }

  const base = `https://${r}.api.blizzard.com`;
  const headers = { Authorization: `Bearer ${accessToken}` };
  const games = [];

  // Overwatch 2 is free-to-play: every authenticated Battle.net account has it.
  games.push({ productId: "overwatch2", name: "Overwatch 2", lastPlayedAt: null });

  // World of Warcraft — requires wow.profile scope.
  try {
    const wowRes = await fetch(
      `${base}/profile/user/wow?namespace=profile-${r}&locale=en_US`,
      { headers }
    );
    if (wowRes.ok) {
      const wowData = await wowRes.json();
      if ((wowData.wow_accounts ?? []).length > 0) {
        games.push({ productId: "wow", name: "World of Warcraft", lastPlayedAt: null });
      }
    }
  } catch {}

  // StarCraft II — requires sc2.profile scope.
  try {
    const sc2Res = await fetch(`${base}/sc2/profile/user`, { headers });
    if (sc2Res.ok) {
      const sc2Data = await sc2Res.json();
      if ((sc2Data.profiles ?? []).length > 0) {
        games.push({ productId: "starcraft2", name: "StarCraft II", lastPlayedAt: null });
      }
    }
  } catch {}

  // Diablo IV — detect via character list endpoint.
  if (accountId) {
    try {
      const d4Res = await fetch(
        `${base}/d4/en_US/profile/${accountId}/hero`,
        { headers }
      );
      if (d4Res.ok) {
        games.push({ productId: "diablo4", name: "Diablo IV", lastPlayedAt: null });
      }
    } catch {}
  }

  // If all per-game checks failed (e.g. newly-created account), return at minimum OW2.
  return games;
}
