// Ubisoft Connect sync planner — dry-run analysis of what a real sync would do.

import { normalizeUbisoftGames } from "@/lib/integrations/ubisoft/ubisoftNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";

/**
 * @param {{ rawUbisoftGames: Array, externalSources: Array, existingUserGames: object }} opts
 */
export function planUbisoftSync({ rawUbisoftGames, externalSources, existingUserGames }) {
  const normalized = normalizeUbisoftGames(rawUbisoftGames);

  const resolved = normalized.map((g) => ({
    ...g,
    canonicalGameId: matchDetectedGameToCanonical("ubisoft", g.externalId, externalSources),
    matched: Boolean(matchDetectedGameToCanonical("ubisoft", g.externalId, externalSources)),
  }));

  const matchedGames = resolved.filter((g) => g.canonicalGameId);
  const unmatchedGames = resolved.filter((g) => !g.canonicalGameId);

  const plannedUserGameCreates = matchedGames.filter((g) => !existingUserGames[g.canonicalGameId]);
  const plannedUserGameUpdates = matchedGames.filter((g) => existingUserGames[g.canonicalGameId]);

  const warnings = [];
  if (unmatchedGames.length > 0) {
    warnings.push(`${unmatchedGames.length} Ubisoft title(s) could not be matched to the canonical catalogue.`);
  }

  return {
    mode: "dry_run",
    provider: "ubisoft",
    summary: {
      rawGamesDetected: rawUbisoftGames.length,
      matchedCanonicalGames: matchedGames.length,
      unmatchedGames: unmatchedGames.length,
      userGamesToCreate: plannedUserGameCreates.length,
      userGamesToUpdate: plannedUserGameUpdates.length,
    },
    matchedGames,
    unmatchedGames,
    plannedUserGameCreates,
    plannedUserGameUpdates,
    externalSourcesKnown: externalSources.filter((s) => s.platform === "ubisoft").length,
    warnings,
  };
}
