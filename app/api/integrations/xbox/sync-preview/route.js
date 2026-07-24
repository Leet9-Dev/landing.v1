import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchXboxOwnedGames, hasXboxApiKey } from "@/lib/integrations/xbox/xboxClient";
import { planXboxSync } from "@/lib/integrations/xbox/xboxSyncPlanner";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  let gamertag = null;
  let live = false;

  if (hasXboxApiKey()) {
    const account = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "xbox" } },
    });
    if (account?.status === "connected" && account.externalUserId) {
      gamertag = account.externalUserId;
      live = true;
    }
  }

  let rawXboxGames;
  try {
    rawXboxGames = await fetchXboxOwnedGames(gamertag ?? "fixture");
  } catch {
    return apiError("XBOX_API_ERROR", "Could not fetch Xbox library. Try again shortly.", 502);
  }

  const existingRows = live
    ? await prisma.userGame.findMany({ where: { userId }, select: { canonicalGameId: true, playtimeHours: true } })
    : [];

  const existingUserGames = Object.fromEntries(
    existingRows.map((r) => [r.canonicalGameId, { hoursPlayed: r.playtimeHours ?? 0 }])
  );

  const plan = planXboxSync({ rawXboxGames, externalSources: MOCK_EXTERNAL_SOURCES, existingUserGames });

  const dryRunNote = live
    ? "No data was persisted. Real Xbox library used."
    : "No data was persisted. No real Xbox API was called (no key or no connected account).";

  return apiOk({ ...plan, dryRunNote }, { live, provider: "xbox" });
}
