// Steam sync planner — dry-run only.
//
// Given normalized Steam detected games + existing Leet9 data, produces a
// sync plan describing what WOULD happen on a real sync. Nothing is persisted.
//
// Uses canonical matching from lib/platforms/canonicalMatching.js so the
// planner stays platform-agnostic at the matching layer.

import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";
import { normalizeSteamGames } from "@/lib/integrations/steam/steamNormalizer";

/**
 * Produce a dry-run Steam sync plan.
 *
 * @param {object} params
 * @param {Array}  params.rawSteamGames      - raw Steam owned-game objects (from Steam API / fixtures)
 * @param {Array}  params.externalSources    - GameExternalSource records (mock or real)
 * @param {object} params.existingUserGames  - keyed by canonical gameId { [gameId]: UserGame }
 * @returns {object} sync plan (never persisted)
 */
export function planSteamSync({ rawSteamGames, externalSources, existingUserGames }) {
  const normalized = normalizeSteamGames(rawSteamGames);
  const warnings = [];

  // Resolve canonical game IDs
  const resolved = normalized.map((game) => {
    const canonicalGameId = matchDetectedGameToCanonical(
      "steam",
      game.externalId,
      externalSources
    );
    return { ...game, canonicalGameId, matched: Boolean(canonicalGameId) };
  });

  const matchedGames = resolved.filter((g) => g.matched);
  const unmatchedGames = resolved.filter((g) => !g.matched);

  if (unmatchedGames.length > 0) {
    warnings.push(
      `${unmatchedGames.length} Steam game(s) have no canonical match and will not enter Discovery. ` +
      `They should be routed to a future matching review queue.`
    );
  }

  // Classify matched games into create vs update paths
  const plannedUserGameCreates = [];
  const plannedUserGameUpdates = [];

  for (const game of matchedGames) {
    const existing = existingUserGames[game.canonicalGameId];
    if (existing) {
      plannedUserGameUpdates.push({
        canonicalGameId: game.canonicalGameId,
        externalId: game.externalId,
        externalTitle: game.externalTitle,
        currentHoursPlayed: existing.hoursPlayed,
        newHoursPlayed: game.playtimeHours,
        hoursPlayedDelta: Math.max(0, game.playtimeHours - existing.hoursPlayed),
        lastPlayedAt: game.lastPlayedAt,
        note: "Would update playtime and lastPlayedAt; achievement sync is a follow-up step.",
      });
    } else {
      plannedUserGameCreates.push({
        canonicalGameId: game.canonicalGameId,
        externalId: game.externalId,
        externalTitle: game.externalTitle,
        hoursPlayed: game.playtimeHours,
        lastPlayedAt: game.lastPlayedAt,
        note: "Would create a new UserGame record for this canonical game.",
      });
    }
  }

  const externalSourcesKnown = matchedGames.map((g) => g.externalId);
  const externalSourcesMissing = unmatchedGames.map((g) => ({
    externalId: g.externalId,
    externalTitle: g.externalTitle,
  }));

  return {
    mode: "dry_run",
    provider: "steam",
    summary: {
      rawGamesDetected: normalized.length,
      matchedCanonicalGames: matchedGames.length,
      unmatchedGames: unmatchedGames.length,
      userGamesToCreate: plannedUserGameCreates.length,
      userGamesToUpdate: plannedUserGameUpdates.length,
    },
    matchedGames,
    unmatchedGames,
    plannedUserGameCreates,
    plannedUserGameUpdates,
    externalSourcesKnown,
    externalSourcesMissing,
    warnings,
  };
}
