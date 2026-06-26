import { requireSession } from "@/lib/api/auth";
import { apiOk } from "@/lib/api/response";
import { fetchSteamOwnedGames, DRY_RUN } from "@/lib/integrations/steam/steamClient";
import { planSteamSync } from "@/lib/integrations/steam/steamSyncPlanner";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";
import { MOCK_USER_GAMES } from "@/lib/mock/userGames";

// Dry-run Steam sync preview.
//
// Returns what a real Steam library sync WOULD do — matched/unmatched games,
// planned UserGame creates and updates — without persisting anything or calling
// the real Steam API.
//
// This endpoint exists so the sync logic can be verified and reviewed before
// real persistence or a live Steam API key is added.

export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  // In dry-run mode this returns fixture data, not real Steam data.
  // steamId64 would come from the session token in a real sync.
  const rawSteamGames = await fetchSteamOwnedGames("dry_run_no_steamid");

  const plan = planSteamSync({
    rawSteamGames,
    externalSources: MOCK_EXTERNAL_SOURCES,
    existingUserGames: MOCK_USER_GAMES,
  });

  return apiOk(
    { ...plan, dryRunNote: "No data was persisted. No real Steam API was called." },
    { dryRun: DRY_RUN, provider: "steam" }
  );
}
