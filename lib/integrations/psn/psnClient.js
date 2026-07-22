// PSN Trophy API client.
//
// Two modes:
//   LIVE   — decrypts stored NPSSO, exchanges for access token, calls PSN API via psn-api.
//   FIXTURE — returns mock data when no encrypted credential is available.
//
// PSN does not have a developer API key. Real sync requires a per-user NPSSO
// token obtained from ca.account.sony.com/api/v1/ssocookie while logged in.
// The token is stored AES-256-GCM encrypted in PlatformAccount.metadata.npsso.
// It must never be logged, returned to clients, or stored unencrypted.

import { decryptNpsso } from "@/lib/integrations/psn/credentialStore";
import { PSN_RAW_API_RESPONSE } from "@/lib/integrations/psn/psnFixtures";
import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  getUserTitles,
} from "psn-api";

/**
 * Exchange NPSSO for a live PSN authorization payload.
 * Throws on invalid/expired NPSSO.
 *
 * @param {string} npsso - plaintext NPSSO token
 * @returns {Promise<{ accessToken: string }>}
 */
export async function exchangeNpssoForAuth(npsso) {
  const code = await exchangeNpssoForAccessCode(npsso);
  return exchangeAccessCodeForAuthTokens(code);
}

/**
 * Fetch trophy titles for the authenticated PSN account.
 * Uses fixture data when encryptedNpsso is null.
 *
 * @param {object|null} encryptedNpsso - { enc, iv, tag } from PlatformAccount.metadata.npsso
 * @returns {Promise<Array>} raw PSN TrophyTitle objects
 */
export async function fetchPsnTrophyTitles(encryptedNpsso) {
  if (!encryptedNpsso) {
    return PSN_RAW_API_RESPONSE.trophyTitles;
  }

  const npsso = decryptNpsso(encryptedNpsso);
  const auth = await exchangeNpssoForAuth(npsso);

  let allTitles = [];
  let offset = 0;
  const limit = 800;

  while (true) {
    const res = await getUserTitles({ accessToken: auth.accessToken }, "me", { limit, offset });
    allTitles = allTitles.concat(res.trophyTitles ?? []);
    if (!res.nextOffset || res.trophyTitles.length < limit) break;
    offset = res.nextOffset;
  }

  return allTitles;
}
