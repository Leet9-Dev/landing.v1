import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchEpicGames, hasEpicCredentials } from "@/lib/integrations/epic/epicClient";
import { planEpicSync } from "@/lib/integrations/epic/epicSyncPlanner";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  let username = null;
  let live = false;

  if (hasEpicCredentials()) {
    const account = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "epic" } },
    });
    if (account?.status === "connected" && account.externalUserId) {
      username = account.externalUserId;
      live = true;
    }
  }

  let rawEpicGames;
  try {
    rawEpicGames = await fetchEpicGames(username ?? "fixture");
  } catch {
    return apiError("EPIC_API_ERROR", "Could not fetch Epic Games library. Try again shortly.", 502);
  }

  const existingRows = live
    ? await prisma.userGame.findMany({ where: { userId }, select: { canonicalGameId: true, playtimeHours: true } })
    : [];

  const existingUserGames = Object.fromEntries(
    existingRows.map((r) => [r.canonicalGameId, { hoursPlayed: r.playtimeHours ?? 0 }])
  );

  const plan = planEpicSync({ rawEpicGames, externalSources: MOCK_EXTERNAL_SOURCES, existingUserGames });

  const dryRunNote = live
    ? "No data was persisted. Real Epic account used."
    : "No data was persisted. No real Epic API was called (no credentials or no connected account).";

  return apiOk({ ...plan, dryRunNote }, { live, provider: "epic" });
}
