// Twitch game-activity client.
//
// Two modes:
//   LIVE    — fetches the user's top-streamed games from VOD history via Helix API.
//   FIXTURE — returns mock data when credentials are absent.
//
// Twitch does not expose a "game library" (games played offline). Instead we
// derive game activity from VOD history: each video has a game_id + duration.
// We aggregate total streamed hours per game and treat that as playtime.

import { TWITCH_RAW_GAME_HISTORY } from "@/lib/integrations/twitch/twitchFixtures";

export function hasTwitchCredentials() {
  return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

/**
 * Fetch a Twitch app-level access token using Client Credentials flow.
 * Used for server-side API calls that don't need user context.
 */
async function fetchAppToken() {
  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`Twitch app token error: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

/**
 * Fetch aggregated game history for a Twitch user (by user ID).
 * Returns an array of { game_id, game_name, hoursStreamed, lastStreamedAt }.
 *
 * @param {string} twitchUserId - Twitch user ID
 * @returns {Promise<Array>}
 */
export async function fetchTwitchGameHistory(twitchUserId) {
  if (!hasTwitchCredentials() || !twitchUserId || twitchUserId === "fixture") {
    return TWITCH_RAW_GAME_HISTORY;
  }

  const appToken = await fetchAppToken();

  const headers = {
    "Client-Id": process.env.TWITCH_CLIENT_ID,
    Authorization: `Bearer ${appToken}`,
  };

  // Fetch up to 100 recent VODs for the user.
  const videoRes = await fetch(
    `https://api.twitch.tv/helix/videos?user_id=${encodeURIComponent(twitchUserId)}&first=100&type=archive`,
    { headers }
  );

  if (!videoRes.ok) {
    throw new Error(`Twitch video API error: ${videoRes.status} ${videoRes.statusText}`);
  }

  const { data: videos } = await videoRes.json();
  if (!Array.isArray(videos) || videos.length === 0) return [];

  // Aggregate hours streamed + last stream date per game.
  const gameMap = new Map();

  for (const video of videos) {
    const gameId = video.game_id;
    if (!gameId) continue;

    const durationSeconds = parseTwitchDuration(video.duration);
    const hoursStreamed = durationSeconds / 3600;
    const streamedAt = video.created_at;

    if (gameMap.has(gameId)) {
      const entry = gameMap.get(gameId);
      entry.hoursStreamed += hoursStreamed;
      if (streamedAt > entry.lastStreamedAt) entry.lastStreamedAt = streamedAt;
    } else {
      gameMap.set(gameId, {
        game_id: gameId,
        game_name: video.game_name ?? null,
        hoursStreamed,
        lastStreamedAt: streamedAt ?? null,
      });
    }
  }

  // Fetch game names for any entries missing them.
  const missingNameIds = [...gameMap.values()].filter((g) => !g.game_name).map((g) => g.game_id);
  if (missingNameIds.length > 0) {
    const idParams = missingNameIds.map((id) => `id=${id}`).join("&");
    const gamesRes = await fetch(`https://api.twitch.tv/helix/games?${idParams}`, { headers });
    if (gamesRes.ok) {
      const { data: gamesData } = await gamesRes.json();
      for (const g of gamesData ?? []) {
        const entry = gameMap.get(g.id);
        if (entry) entry.game_name = g.name;
      }
    }
  }

  return [...gameMap.values()].sort((a, b) => b.hoursStreamed - a.hoursStreamed);
}

/**
 * Parses Twitch duration strings like "1h30m15s" → seconds.
 * @param {string} dur
 * @returns {number}
 */
function parseTwitchDuration(dur) {
  if (!dur) return 0;
  const match = dur.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (!match) return 0;
  const [, h = "0", m = "0", s = "0"] = match;
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}
