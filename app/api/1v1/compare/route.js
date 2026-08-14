import { apiOk, apiError } from "@/lib/api/response";
import {
  fetchSteamPlayerSummaries,
  fetchSteamOwnedGames,
  resolveVanityURL,
} from "@/lib/integrations/steam/steamClient";

const STEAMID64_RE = /^[0-9]{17}$/;
const VANITY_URL_RE = /^https?:\/\/steamcommunity\.com\/(id|profiles)\/([^/]+)/;

async function resolveSteamId(input) {
  const trimmed = input.trim();

  const urlMatch = trimmed.match(VANITY_URL_RE);
  if (urlMatch) {
    const type = urlMatch[1];
    const value = urlMatch[2];
    if (type === "profiles" && STEAMID64_RE.test(value)) return value;
    return resolveVanityURL(value);
  }

  if (STEAMID64_RE.test(trimmed)) return trimmed;

  return resolveVanityURL(trimmed);
}

async function buildPlayerData(input) {
  const steamId = await resolveSteamId(input);
  if (!steamId) return { error: "not_found", input };

  const [summary, games] = await Promise.all([
    fetchSteamPlayerSummaries(steamId),
    fetchSteamOwnedGames(steamId).catch(() => []),
  ]);

  if (!summary) return { error: "not_found", input };

  // communityvisibilitystate: 1 = private, 3 = public
  const isPrivate = summary.communityvisibilitystate !== 3;

  const gameList = Array.isArray(games) ? games : [];
  const totalPlaytimeMinutes = gameList.reduce((s, g) => s + (g.playtime_forever || 0), 0);
  const totalPlaytimeHours = Math.round(totalPlaytimeMinutes / 60);

  const topGames = [...gameList]
    .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
    .slice(0, 5)
    .map((g) => ({
      name: g.name,
      appId: g.appid,
      playtimeHours: Math.round((g.playtime_forever || 0) / 60),
      iconUrl: g.img_icon_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
        : null,
    }));

  return {
    steamId,
    name: summary.personaname,
    avatarUrl: summary.avatarfull || summary.avatarmedium || summary.avatar,
    profileUrl: summary.profileurl,
    isPrivate,
    totalGames: gameList.length,
    totalPlaytimeHours,
    topGames: isPrivate ? [] : topGames,
  };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_BODY", "Invalid JSON body.", 400);
  }

  const { p1, p2 } = body ?? {};
  if (!p1 || !p2) return apiError("MISSING_PARAMS", "Both p1 and p2 are required.", 400);
  if (typeof p1 !== "string" || typeof p2 !== "string")
    return apiError("INVALID_PARAMS", "p1 and p2 must be strings.", 400);

  const [player1, player2] = await Promise.all([buildPlayerData(p1), buildPlayerData(p2)]);

  return apiOk({ player1, player2 });
}
