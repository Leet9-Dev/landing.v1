import { fetchSteamAchievements, fetchSteamOwnedGames, fetchSteamPlayerSummaries } from "./steamClient";

/**
 * Compute the L9 Score for a player given their game list.
 * achievement rate (60%) + gaming intensity (40%)
 *
 * @param {string} steamId
 * @param {Array} gameList  raw Steam owned-game objects
 * @returns {Promise<{ l9Score, achievementRatePct, avgHoursPerGame }>}
 */
export async function computeL9Score(steamId, gameList) {
  const playedGames = gameList.filter((g) => (g.playtime_forever || 0) > 30);
  const totalHours = gameList.reduce((s, g) => s + (g.playtime_forever || 0), 0) / 60;
  const avgHoursPerGame = playedGames.length > 0 ? totalHours / playedGames.length : 0;
  const intensityScore = Math.min(avgHoursPerGame / 2, 100);

  const top5 = [...gameList]
    .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
    .slice(0, 5);

  const achResults = await Promise.allSettled(
    top5.map((g) => fetchSteamAchievements(steamId, g.appid))
  );

  const rates = achResults
    .filter((r) => r.status === "fulfilled" && Array.isArray(r.value?.achievements))
    .map((r) => {
      const achievements = r.value.achievements;
      if (!achievements.length) return null;
      return achievements.filter((a) => a.achieved === 1).length / achievements.length;
    })
    .filter((r) => r !== null);

  const achievementRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

  return {
    l9Score: Math.round(achievementRate * 100 * 0.6 + intensityScore * 0.4),
    achievementRatePct: Math.round(achievementRate * 100),
    avgHoursPerGame: Math.round(avgHoursPerGame),
  };
}

/**
 * Fetch a full player profile (summary + games + L9 Score) by SteamID64.
 * Returns null if not found, or { error: "private" } for private profiles.
 */
export async function fetchPlayerProfile(steamId) {
  const [summary, games] = await Promise.all([
    fetchSteamPlayerSummaries(steamId),
    fetchSteamOwnedGames(steamId).catch(() => []),
  ]);

  if (!summary) return null;

  const isPrivate = summary.communityvisibilitystate !== 3;
  const gameList = Array.isArray(games) ? games : [];
  const totalPlaytimeHours = Math.round(
    gameList.reduce((s, g) => s + (g.playtime_forever || 0), 0) / 60
  );

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

  const { l9Score, achievementRatePct, avgHoursPerGame } = isPrivate
    ? { l9Score: 0, achievementRatePct: 0, avgHoursPerGame: 0 }
    : await computeL9Score(steamId, gameList);

  return {
    steamId,
    name: summary.personaname,
    avatarUrl: summary.avatarfull || summary.avatarmedium || summary.avatar,
    profileUrl: summary.profileurl,
    isPrivate,
    totalGames: gameList.length,
    totalPlaytimeHours,
    topGames: isPrivate ? [] : topGames,
    l9Score,
    achievementRatePct,
    avgHoursPerGame,
  };
}
