// itch.io sync planner — dry-run analysis of what a real sync would do.

import { normalizeItchGames } from "@/lib/integrations/itch/itchNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";

/**
 * @param {{ rawItchGames: Array, externalSources: Array, existingUserGames: object }} opts
 */
export function planItchSync({ rawItchGames, externalSources, existingUserGames }) {
  const normalized = normalizeItchGames(rawItchGames);

  const resolved = normalized.map((g) => ({
    ...g,
    canonicalGameId: matchDetectedGameToCanonical("itch", g.externalId, externalSources),
    matched: Boolean(matchDetectedGameToCanonical("itch", g.externalId, externalSources)),
  }));

  const matchedGames = resolved.filter((g) => g.canonicalGameId);
  const unmatchedGames = resolved.filter((g) => !g.canonicalGameId);

  const plannedUserGameCreates = matchedGames.filter((g) => !existingUserGames[g.canonicalGameId]);
  const plannedUserGameUpdates = matchedGames.filter((g) => existingUserGames[g.canonicalGameId]);

  const warnings = [];
  if (unmatchedGames.length > 0) {
    warnings.push(`${unmatchedGames.length} itch.io title(s) are not yet in the canonical catalogue.`);
  }

  return {
    mode: "dry_run",
    provider: "itch",
    summary: {
      rawGamesDetected: rawItchGames.length,
      matchedCanonicalGames: matchedGames.length,
      unmatchedGames: unmatchedGames.length,
      userGamesToCreate: plannedUserGameCreates.length,
      userGamesToUpdate: plannedUserGameUpdates.length,
    },
    matchedGames,
    unmatchedGames,
    plannedUserGameCreates,
    plannedUserGameUpdates,
    externalSourcesKnown: externalSources.filter((s) => s.platform === "itch").length,
    warnings,
  };
}
