import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchTwitchGameHistory, hasTwitchCredentials } from "@/lib/integrations/twitch/twitchClient";
import { normalizeTwitchGames } from "@/lib/integrations/twitch/twitchNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  let twitchUserId = null;
  let live = false;

  if (hasTwitchCredentials()) {
    const account = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "twitch" } },
    });
    if (account?.status === "connected" && account.externalUserId) {
      twitchUserId = account.externalUserId;
      live = true;
    }
  }

  let rawGames;
  try {
    rawGames = await fetchTwitchGameHistory(twitchUserId ?? "fixture");
  } catch {
    return apiError("TWITCH_API_ERROR", "Could not fetch Twitch game history. Try again shortly.", 502);
  }

  const normalized = normalizeTwitchGames(rawGames);
  const resolved = normalized.map((g) => ({
    ...g,
    canonicalGameId: matchDetectedGameToCanonical("twitch", g.externalId, MOCK_EXTERNAL_SOURCES),
  }));

  const matched = resolved.filter((g) => g.canonicalGameId);
  const unmatched = resolved.filter((g) => !g.canonicalGameId);

  const dryRunNote = live
    ? "No data was persisted. Real Twitch game history used."
    : "No data was persisted. No real Twitch API was called (no credentials or no connected account).";

  return apiOk(
    {
      provider: "twitch",
      rawGamesDetected: rawGames.length,
      matchedCanonicalGames: matched.length,
      unmatchedGames: unmatched.length,
      matched: matched.map((g) => ({ externalId: g.externalId, externalTitle: g.externalTitle, canonicalGameId: g.canonicalGameId, playtimeHours: g.playtimeHours })),
      unmatched: unmatched.map((g) => ({ externalId: g.externalId, externalTitle: g.externalTitle })),
      dryRunNote,
    },
    { live, provider: "twitch" }
  );
}
