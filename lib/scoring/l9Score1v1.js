/**
 * L9 Score for 1v1 comparisons — computed from Steam owned-games data.
 *
 * Three signals, all derivable from a single GetOwnedGames API call:
 *   Hours    (40%) — total playtime, log-scaled so a 5000h player isn't 50× a 100h player
 *   Breadth  (30%) — unique games played (> 0 min), log-scaled cap at 500 titles
 *   Recency  (30%) — days since last play, linear decay over 300 days
 *
 * Score is out of 1000.
 */
export function computeL91v1Score(games = []) {
  const totalMinutes = games.reduce((sum, g) => sum + (g.playtime_forever || 0), 0);
  const totalHours = totalMinutes / 60;

  const gamesPlayed = games.filter((g) => (g.playtime_forever || 0) > 0).length;

  const lastPlayed = games.reduce(
    (max, g) => Math.max(max, g.rtime_last_played || 0),
    0
  );
  const daysSinceLastPlay =
    lastPlayed > 0 ? (Date.now() / 1000 - lastPlayed) / 86400 : 999;

  const hoursScore = Math.min(
    400,
    Math.round((Math.log10(1 + totalHours) / Math.log10(5001)) * 400)
  );
  const breadthScore = Math.min(
    300,
    Math.round((Math.log10(1 + gamesPlayed) / Math.log10(501)) * 300)
  );
  const recencyScore = Math.max(0, Math.round(300 - daysSinceLastPlay));

  return {
    total: hoursScore + breadthScore + recencyScore,
    breakdown: {
      hours: hoursScore,
      breadth: breadthScore,
      recency: recencyScore,
    },
    raw: {
      totalHours: Math.round(totalHours),
      gamesPlayed,
      lastPlayedDaysAgo: Math.round(daysSinceLastPlay),
    },
  };
}
