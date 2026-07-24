// Riot sync planner — dry-run analysis of what a real sync would do.

import { normalizeRiotGames } from "@/lib/integrations/riot/riotNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";

/**
 * @param {{ rawRiotGames: Array, externalSources: Array, existingUserGames: object }} opts
 */
export function planRiotSync({ rawRiotGames, externalSources, existingUserGames }) {
  const normalized = normalizeRiotGames(rawRiotGames);

  const resolved = normalized.map((g) => ({
    ...g,
    canonicalGameId: matchDetectedGameToCanonical("riot", g.externalId, externalSources),
    matched: Boolean(matchDetectedGameToCanonical("riot", g.externalId, externalSources)),
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
      `${unmatchedGames.length} Riot title(s) are not yet in the canonical catalogue. They will be queued for future matching.`
    );
  }

  return {
    mode: "dry_run",
    provider: "riot",
    summary: {
      rawGamesDetected: rawRiotGames.length,
      matchedCanonicalGames: matchedGames.length,
      unmatchedGames: unmatchedGames.length,
      userGamesToCreate: plannedUserGameCreates.length,
      userGamesToUpdate: plannedUserGameUpdates.length,
    },
    matchedGames,
    unmatchedGames,
    plannedUserGameCreates,
    plannedUserGameUpdates,
    externalSourcesKnown: externalSources.filter((s) => s.platform === "riot").length,
    warnings,
  };
}
