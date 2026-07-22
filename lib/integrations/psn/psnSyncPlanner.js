// PSN sync planner — dry-run only.
//
// Given normalized PSN trophy titles + existing Leet9 data, produces a
// sync plan describing what WOULD happen on a real sync. Nothing is persisted.
//
// Mirrors steamSyncPlanner.js. PSN-specific: no playtime data, trophies
// replace achievements.

import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";
import { normalizePsnTitles } from "@/lib/integrations/psn/psnNormalizer";

/**
 * Produce a dry-run PSN sync plan.
 *
 * @param {object} params
 * @param {Array}  params.rawPsnTitles     - raw PSN trophy title objects
 * @param {Array}  params.externalSources  - GameExternalSource records (mock or real)
 * @param {object} params.existingUserGames - keyed by canonical gameId { [gameId]: UserGame }
 * @returns {object} sync plan (never persisted)
 */
export function planPsnSync({ rawPsnTitles, externalSources, existingUserGames }) {
  const normalized = normalizePsnTitles(rawPsnTitles);
  const warnings = [];

  const resolved = normalized.map((game) => {
    const canonicalGameId = matchDetectedGameToCanonical(
      "psn",
      game.externalId,
      externalSources
    );
    return { ...game, canonicalGameId, matched: Boolean(canonicalGameId) };
  });

  const matchedGames = resolved.filter((g) => g.matched);
  const unmatchedGames = resolved.filter((g) => !g.matched);

  if (unmatchedGames.length > 0) {
    warnings.push(
      `${unmatchedGames.length} PSN title(s) have no canonical match and will not enter Discovery. ` +
      `They should be routed to a future matching review queue.`
    );
  }

  warnings.push(
    "PSN does not expose playtime data. Hours Played will remain null for PSN-sourced games."
  );

  const plannedUserGameCreates = [];
  const plannedUserGameUpdates = [];

  for (const game of matchedGames) {
    const existing = existingUserGames[game.canonicalGameId];
    if (existing) {
      plannedUserGameUpdates.push({
        canonicalGameId: game.canonicalGameId,
        externalId: game.externalId,
        externalTitle: game.externalTitle,
        trophiesUnlocked: game.trophiesUnlocked,
        lastPlayedAt: game.lastPlayedAt,
        note: "Would update trophiesUnlocked and lastPlayedAt.",
      });
    } else {
      plannedUserGameCreates.push({
        canonicalGameId: game.canonicalGameId,
        externalId: game.externalId,
        externalTitle: game.externalTitle,
        trophiesUnlocked: game.trophiesUnlocked,
        lastPlayedAt: game.lastPlayedAt,
        note: "Would create a new UserGame record for this canonical game.",
      });
    }
  }

  return {
    mode: "dry_run",
    provider: "psn",
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
    warnings,
  };
}
