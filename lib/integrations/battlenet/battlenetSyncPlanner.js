// Battle.net sync planner — dry-run analysis of what a real sync would do.

import { normalizeBattlenetGames } from "@/lib/integrations/battlenet/battlenetNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";

/**
 * @param {{ rawBattlenetGames: Array, externalSources: Array, existingUserGames: object }} opts
 */
export function planBattlenetSync({ rawBattlenetGames, externalSources, existingUserGames }) {
  const normalized = normalizeBattlenetGames(rawBattlenetGames);

  const resolved = normalized.map((g) => ({
    ...g,
    canonicalGameId: matchDetectedGameToCanonical("battlenet", g.externalId, externalSources),
    matched: Boolean(matchDetectedGameToCanonical("battlenet", g.externalId, externalSources)),
  }));

  const matchedGames = resolved.filter((g) => g.canonicalGameId);
  const unmatchedGames = resolved.filter((g) => !g.canonicalGameId);

  const plannedUserGameCreates = matchedGames.filter(
    (g) => !existingUserGames[g.canonicalGameId]
  );
  const plannedUserGameUpdates = matchedGames.filter(
    (g) => existingUserGames[g.canonicalGameId]
  );

  const warnings = [];
  if (unmatchedGames.length > 0) {
    warnings.push(
      `${unmatchedGames.length} Battle.net title(s) could not be matched to the canonical catalogue.`
    );
  }

  return {
    mode: "dry_run",
    provider: "battlenet",
    summary: {
      rawGamesDetected: rawBattlenetGames.length,
      matchedCanonicalGames: matchedGames.length,
      unmatchedGames: unmatchedGames.length,
      userGamesToCreate: plannedUserGameCreates.length,
      userGamesToUpdate: plannedUserGameUpdates.length,
    },
    matchedGames,
    unmatchedGames,
    plannedUserGameCreates,
    plannedUserGameUpdates,
    externalSourcesKnown: externalSources.filter((s) => s.platform === "battlenet").length,
    warnings,
  };
}
