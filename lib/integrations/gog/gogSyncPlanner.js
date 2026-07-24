// GOG sync planner — dry-run analysis of what a real sync would do.

import { normalizeGogGames } from "@/lib/integrations/gog/gogNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";

/**
 * @param {{ rawGogGames: Array, externalSources: Array, existingUserGames: object }} opts
 */
export function planGogSync({ rawGogGames, externalSources, existingUserGames }) {
  const normalized = normalizeGogGames(rawGogGames);

  const resolved = normalized.map((g) => ({
    ...g,
    canonicalGameId: matchDetectedGameToCanonical("gog", g.externalId, externalSources),
    matched: Boolean(matchDetectedGameToCanonical("gog", g.externalId, externalSources)),
  }));

  const matchedGames = resolved.filter((g) => g.canonicalGameId);
  const unmatchedGames = resolved.filter((g) => !g.canonicalGameId);

  const plannedUserGameCreates = matchedGames.filter((g) => !existingUserGames[g.canonicalGameId]);
  const plannedUserGameUpdates = matchedGames.filter((g) => existingUserGames[g.canonicalGameId]);

  const warnings = [];
  if (unmatchedGames.length > 0) {
    warnings.push(`${unmatchedGames.length} GOG title(s) could not be matched to the canonical catalogue.`);
  }

  return {
    mode: "dry_run",
    provider: "gog",
    summary: {
      rawGamesDetected: rawGogGames.length,
      matchedCanonicalGames: matchedGames.length,
      unmatchedGames: unmatchedGames.length,
      userGamesToCreate: plannedUserGameCreates.length,
      userGamesToUpdate: plannedUserGameUpdates.length,
    },
    matchedGames,
    unmatchedGames,
    plannedUserGameCreates,
    plannedUserGameUpdates,
    externalSourcesKnown: externalSources.filter((s) => s.platform === "gog").length,
    warnings,
  };
}
