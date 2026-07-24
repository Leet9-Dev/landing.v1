// EA App sync planner — dry-run analysis of what a real sync would do.

import { normalizeEaGames } from "@/lib/integrations/ea/eaNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";

/**
 * @param {{ rawEaGames: Array, externalSources: Array, existingUserGames: object }} opts
 */
export function planEaSync({ rawEaGames, externalSources, existingUserGames }) {
  const normalized = normalizeEaGames(rawEaGames);

  const resolved = normalized.map((g) => ({
    ...g,
    canonicalGameId: matchDetectedGameToCanonical("ea", g.externalId, externalSources),
    matched: Boolean(matchDetectedGameToCanonical("ea", g.externalId, externalSources)),
  }));

  const matchedGames = resolved.filter((g) => g.canonicalGameId);
  const unmatchedGames = resolved.filter((g) => !g.canonicalGameId);

  const plannedUserGameCreates = matchedGames.filter((g) => !existingUserGames[g.canonicalGameId]);
  const plannedUserGameUpdates = matchedGames.filter((g) => existingUserGames[g.canonicalGameId]);

  const warnings = [];
  if (unmatchedGames.length > 0) {
    warnings.push(`${unmatchedGames.length} EA title(s) could not be matched to the canonical catalogue.`);
  }

  return {
    mode: "dry_run",
    provider: "ea",
    summary: {
      rawGamesDetected: rawEaGames.length,
      matchedCanonicalGames: matchedGames.length,
      unmatchedGames: unmatchedGames.length,
      userGamesToCreate: plannedUserGameCreates.length,
      userGamesToUpdate: plannedUserGameUpdates.length,
    },
    matchedGames,
    unmatchedGames,
    plannedUserGameCreates,
    plannedUserGameUpdates,
    externalSourcesKnown: externalSources.filter((s) => s.platform === "ea").length,
    warnings,
  };
}
