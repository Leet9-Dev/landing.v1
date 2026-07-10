import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchSteamOwnedGames, hasSteamApiKey } from "@/lib/integrations/steam/steamClient";
import { planSteamSync } from "@/lib/integrations/steam/steamSyncPlanner";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";
import { MOCK_USER_GAMES } from "@/lib/mock/userGames";

// Steam sync preview (dry-run).
//
// When STEAM_API_KEY is set and the current user has a connected Steam
// PlatformAccount, fetches their real library and computes the sync plan.
// Never persists anything. Falls back to fixture data when the key or a
// connected account is absent.

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  let steamId64 = null;
  let live = false;

  if (hasSteamApiKey()) {
    const account = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "steam" } },
    });
    if (account?.status === "connected" && account.externalUserId) {
      steamId64 = account.externalUserId;
      live = true;
    }
  }

  let rawSteamGames;
  try {
    rawSteamGames = await fetchSteamOwnedGames(steamId64 ?? "fixture");
  } catch (e) {
    return apiError("STEAM_API_ERROR", "Could not fetch Steam library. Try again shortly.", 502);
  }

  if (live && rawSteamGames.length === 0) {
    return apiOk(
      {
        mode: "dry_run",
        provider: "steam",
        summary: { rawGamesDetected: 0, matchedCanonicalGames: 0, unmatchedGames: 0, userGamesToCreate: 0, userGamesToUpdate: 0 },
        matchedGames: [],
        unmatchedGames: [],
        plannedUserGameCreates: [],
        plannedUserGameUpdates: [],
        warnings: ["Steam returned 0 games. Your library may be set to private."],
        dryRunNote: "No data was persisted.",
      },
      { live, provider: "steam" }
    );
  }

  const plan = planSteamSync({
    rawSteamGames,
    externalSources: MOCK_EXTERNAL_SOURCES,
    existingUserGames: MOCK_USER_GAMES,
  });

  const dryRunNote = live
    ? "No data was persisted. Real Steam library used."
    : "No data was persisted. No real Steam API was called (no key or no connected account).";

  return apiOk(
    { ...plan, dryRunNote },
    { live, provider: "steam" }
  );
}
