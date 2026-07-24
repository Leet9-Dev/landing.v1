// Xbox sync planner — dry-run analysis of what a real sync would do.

import { normalizeXboxGames } from "@/lib/integrations/xbox/xboxNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";

/**
 * @param {{ rawXboxGames: Array, externalSources: Array, existingUserGames: object }} opts
 */
export function planXboxSync({ rawXboxGames, externalSources, existingUserGames }) {
  const normalized = normalizeXboxGames(rawXboxGames);

  const resolved = normalized.map((g) => ({
    ...g,
    canonicalGameId: matchDetectedGameToCanonical("xbox", g.externalId, externalSources),
    matched: Boolean(matchDetectedGameToCanonical("xbox", g.externalId, externalSources)),
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
      `${unmatchedGames.length} game(s) could not be matched to the canonical catalogue and will not appear in Discovery.`
    );
  }

  return {
    mode: "dry_run",
    provider: "xbox",
    summary: {
      rawGamesDetected: rawXboxGames.length,
      matchedCanonicalGames: matchedGames.length,
      unmatchedGames: unmatchedGames.length,
      userGamesToCreate: plannedUserGameCreates.length,
      userGamesToUpdate: plannedUserGameUpdates.length,
    },
    matchedGames,
    unmatchedGames,
    plannedUserGameCreates,
    plannedUserGameUpdates,
    externalSourcesKnown: externalSources.filter((s) => s.platform === "xbox").length,
    warnings,
  };
}
