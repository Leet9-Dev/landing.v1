/**
 * Normalize raw Twitch game history entries into the Leet9 detected-game shape.
 *
 * Input: [{ game_id, game_name, hoursStreamed, lastStreamedAt }]
 * Output: [{ externalId, externalTitle, playtimeHours, lastPlayedAt }]
 */
export function normalizeTwitchGames(rawGames) {
  return rawGames
    .filter((g) => g.game_id)
    .map((g) => ({
      externalId: String(g.game_id),
      externalTitle: g.game_name ?? null,
      playtimeHours: g.hoursStreamed ? Math.round(g.hoursStreamed * 10) / 10 : null,
      lastPlayedAt: g.lastStreamedAt ?? null,
    }));
}
