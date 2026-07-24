import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchItchOwnedGames } from "@/lib/integrations/itch/itchClient";
import { planItchSync } from "@/lib/integrations/itch/itchSyncPlanner";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  let username = null;
  let live = false;

  const account = await prisma.platformAccount.findUnique({
    where: { userId_provider: { userId, provider: "itch" } },
  });
  if (account?.status === "connected" && account.externalUserId) {
    username = account.externalUserId;
    live = true;
  }

  let rawItchGames;
  try {
    rawItchGames = await fetchItchOwnedGames(username ?? "fixture");
  } catch {
    return apiError("ITCH_API_ERROR", "Could not fetch itch.io library. Try again shortly.", 502);
  }

  const existingRows = live
    ? await prisma.userGame.findMany({ where: { userId }, select: { canonicalGameId: true, playtimeHours: true } })
    : [];
  const existingUserGames = Object.fromEntries(existingRows.map((r) => [r.canonicalGameId, { hoursPlayed: r.playtimeHours ?? 0 }]));

  const plan = planItchSync({ rawItchGames, externalSources: MOCK_EXTERNAL_SOURCES, existingUserGames });
  const dryRunNote = live
    ? "No data was persisted. Real itch.io library used."
    : "No data was persisted. No connected itch.io account.";

  return apiOk({ ...plan, dryRunNote }, { live, provider: "itch" });
}
