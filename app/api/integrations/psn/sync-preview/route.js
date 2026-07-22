import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchPsnTrophyTitles, hasPsnCredentials } from "@/lib/integrations/psn/psnClient";
import { planPsnSync } from "@/lib/integrations/psn/psnSyncPlanner";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  let psnId = null;
  let live = false;

  if (hasPsnCredentials()) {
    const account = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "psn" } },
    });
    if (account?.status === "connected" && account.externalUserId) {
      psnId = account.externalUserId;
      live = true;
    }
  }

  let rawPsnTitles;
  try {
    rawPsnTitles = await fetchPsnTrophyTitles(psnId ?? "fixture");
  } catch {
    return apiError("PSN_API_ERROR", "Could not fetch PSN trophy library. Try again shortly.", 502);
  }

  const existingRows = live
    ? await prisma.userGame.findMany({ where: { userId }, select: { canonicalGameId: true, playtimeHours: true } })
    : [];

  const existingUserGames = Object.fromEntries(
    existingRows.map((r) => [r.canonicalGameId, { hoursPlayed: r.playtimeHours ?? 0 }])
  );

  const plan = planPsnSync({
    rawPsnTitles,
    externalSources: MOCK_EXTERNAL_SOURCES,
    existingUserGames,
  });

  const dryRunNote = live
    ? "No data was persisted. Real PSN library used."
    : "No data was persisted. Fixture data used (no PSN credentials configured).";

  return apiOk({ ...plan, dryRunNote }, { live, provider: "psn" });
}
