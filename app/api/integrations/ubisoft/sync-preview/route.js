import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchUbisoftGames } from "@/lib/integrations/ubisoft/ubisoftClient";
import { planUbisoftSync } from "@/lib/integrations/ubisoft/ubisoftSyncPlanner";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  let username = null;
  let live = false;

  const account = await prisma.platformAccount.findUnique({
    where: { userId_provider: { userId, provider: "ubisoft" } },
  });
  if (account?.status === "connected" && account.externalUserId) {
    username = account.externalUserId;
    live = true;
  }

  let rawUbisoftGames;
  try {
    rawUbisoftGames = await fetchUbisoftGames(username ?? "fixture");
  } catch {
    return apiError("UBISOFT_API_ERROR", "Could not fetch Ubisoft Connect library. Try again shortly.", 502);
  }

  const existingRows = live
    ? await prisma.userGame.findMany({ where: { userId }, select: { canonicalGameId: true, playtimeHours: true } })
    : [];
  const existingUserGames = Object.fromEntries(existingRows.map((r) => [r.canonicalGameId, { hoursPlayed: r.playtimeHours ?? 0 }]));

  const plan = planUbisoftSync({ rawUbisoftGames, externalSources: MOCK_EXTERNAL_SOURCES, existingUserGames });
  const dryRunNote = live
    ? "No data was persisted. Real Ubisoft Connect library used."
    : "No data was persisted. No connected Ubisoft account.";

  return apiOk({ ...plan, dryRunNote }, { live, provider: "ubisoft" });
}
