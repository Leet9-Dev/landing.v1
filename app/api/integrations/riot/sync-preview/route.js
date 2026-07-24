import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchRiotGames, hasRiotApiKey } from "@/lib/integrations/riot/riotClient";
import { planRiotSync } from "@/lib/integrations/riot/riotSyncPlanner";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  let riotId = null;
  let live = false;

  if (hasRiotApiKey()) {
    const account = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "riot" } },
    });
    if (account?.status === "connected" && account.externalUserId) {
      riotId = account.externalUserId;
      live = true;
    }
  }

  let rawRiotGames;
  try {
    rawRiotGames = await fetchRiotGames(riotId ?? "fixture");
  } catch {
    return apiError("RIOT_API_ERROR", "Could not fetch Riot account data. Try again shortly.", 502);
  }

  const existingRows = live
    ? await prisma.userGame.findMany({ where: { userId }, select: { canonicalGameId: true, playtimeHours: true } })
    : [];

  const existingUserGames = Object.fromEntries(
    existingRows.map((r) => [r.canonicalGameId, { hoursPlayed: r.playtimeHours ?? 0 }])
  );

  const plan = planRiotSync({ rawRiotGames, externalSources: MOCK_EXTERNAL_SOURCES, existingUserGames });

  const dryRunNote = live
    ? "No data was persisted. Real Riot account used."
    : "No data was persisted. No real Riot API was called (no key or no connected account).";

  return apiOk({ ...plan, dryRunNote }, { live, provider: "riot" });
}
