// Epic Games sync planner — dry-run analysis of what a real sync would do.

import { normalizeEpicGames } from "@/lib/integrations/epic/epicNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";

/**
 * @param {{ rawEpicGames: Array, externalSources: Array, existingUserGames: object }} opts
 */
export function planEpicSync({ rawEpicGames, externalSources, existingUserGames }) {
  const normalized = normalizeEpicGames(rawEpicGames);

  const resolved = normalized.map((g) => ({
    ...g,
    canonicalGameId: matchDetectedGameToCanonical("epic", g.externalId, externalSources),
    matched: Boolean(matchDetectedGameToCanonical("epic", g.externalId, externalSources)),
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
      `${unmatchedGames.length} Epic title(s) could not be matched to the canonical catalogue.`
    );
  }

  return {
    mode: "dry_run",
    provider: "epic",
    summary: {
      rawGamesDetected: rawEpicGames.length,
      matchedCanonicalGames: matchedGames.length,
      unmatchedGames: unmatchedGames.length,
      userGamesToCreate: plannedUserGameCreates.length,
      userGamesToUpdate: plannedUserGameUpdates.length,
    },
    matchedGames,
    unmatchedGames,
    plannedUserGameCreates,
    plannedUserGameUpdates,
    externalSourcesKnown: externalSources.filter((s) => s.platform === "epic").length,
    warnings,
  };
}
