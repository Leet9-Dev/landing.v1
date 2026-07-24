import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchBattlenetGames, hasBattlenetCredentials } from "@/lib/integrations/battlenet/battlenetClient";
import { planBattlenetSync } from "@/lib/integrations/battlenet/battlenetSyncPlanner";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  let battletag = null;
  let live = false;

  if (hasBattlenetCredentials()) {
    const account = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "battlenet" } },
    });
    if (account?.status === "connected" && account.externalUserId) {
      battletag = account.externalUserId;
      live = true;
    }
  }

  let rawBattlenetGames;
  try {
    rawBattlenetGames = await fetchBattlenetGames(battletag ?? "fixture");
  } catch {
    return apiError("BATTLENET_API_ERROR", "Could not fetch Battle.net library. Try again shortly.", 502);
  }

  const existingRows = live
    ? await prisma.userGame.findMany({ where: { userId }, select: { canonicalGameId: true, playtimeHours: true } })
    : [];

  const existingUserGames = Object.fromEntries(
    existingRows.map((r) => [r.canonicalGameId, { hoursPlayed: r.playtimeHours ?? 0 }])
  );

  const plan = planBattlenetSync({ rawBattlenetGames, externalSources: MOCK_EXTERNAL_SOURCES, existingUserGames });

  const dryRunNote = live
    ? "No data was persisted. Real Battle.net account used."
    : "No data was persisted. No real Battle.net API was called (no credentials or no connected account).";

  return apiOk({ ...plan, dryRunNote }, { live, provider: "battlenet" });
}
