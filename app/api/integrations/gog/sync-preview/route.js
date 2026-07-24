import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchGogOwnedGames } from "@/lib/integrations/gog/gogClient";
import { planGogSync } from "@/lib/integrations/gog/gogSyncPlanner";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  let username = null;
  let live = false;

  const account = await prisma.platformAccount.findUnique({
    where: { userId_provider: { userId, provider: "gog" } },
  });
  if (account?.status === "connected" && account.externalUserId) {
    username = account.externalUserId;
    live = true;
  }

  let rawGogGames;
  try {
    rawGogGames = await fetchGogOwnedGames(username ?? "fixture");
  } catch {
    return apiError("GOG_API_ERROR", "Could not fetch GOG library. Try again shortly.", 502);
  }

  const existingRows = live
    ? await prisma.userGame.findMany({ where: { userId }, select: { canonicalGameId: true, playtimeHours: true } })
    : [];
  const existingUserGames = Object.fromEntries(existingRows.map((r) => [r.canonicalGameId, { hoursPlayed: r.playtimeHours ?? 0 }]));

  const plan = planGogSync({ rawGogGames, externalSources: MOCK_EXTERNAL_SOURCES, existingUserGames });
  const dryRunNote = live
    ? "No data was persisted. Real GOG library used."
    : "No data was persisted. No connected GOG account.";

  return apiOk({ ...plan, dryRunNote }, { live, provider: "gog" });
}
