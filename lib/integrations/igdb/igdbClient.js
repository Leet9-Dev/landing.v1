// IGDB API client — powered by Twitch Developer credentials.
// Token is cached in module scope for the server process lifetime.
// Env vars required: IGDB_CLIENT_ID, IGDB_CLIENT_SECRET.

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE = "https://api.igdb.com/v4";

let _token = null;
let _tokenExpiry = 0;

async function getAccessToken() {
  if (_token && Date.now() < _tokenExpiry - 60_000) return _token;
  const url = `${TOKEN_URL}?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(`IGDB token request failed: ${res.status}`);
  const data = await res.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + data.expires_in * 1000;
  return _token;
}

/**
 * POST an Apicalypse query to an IGDB endpoint.
 * endpoint: e.g. "external_games", "games"
 * body: Apicalypse query string
 */
export async function igdbQuery(endpoint, body) {
  const token = await getAccessToken();
  const res = await fetch(`${IGDB_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });
  if (!res.ok) throw new Error(`IGDB ${endpoint} error: ${res.status}`);
  return res.json();
}

export function hasIgdbCredentials() {
  return Boolean(process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET);
}
