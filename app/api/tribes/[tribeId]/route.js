import { MOCK_TRIBE } from "@/lib/mock/tribe";
import { MOCK_GAMES } from "@/lib/mock/games";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET(request, { params }) {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { tribeId } = await params;

  if (tribeId !== MOCK_TRIBE.id) {
    return apiError("TRIBE_NOT_FOUND", "Tribe not found", 404);
  }

  // Join most-played games with canonical game data (title/studio/platforms).
  const mostPlayedGames = MOCK_TRIBE.mostPlayedGames.map((mp) => {
    const game = MOCK_GAMES.find((g) => g.id === mp.gameId);
    return {
      ...mp,
      title: game?.canonicalTitle ?? "Unknown Game",
      studio: game?.studio ?? null,
      sourcePlatforms: game?.sourcePlatforms ?? [],
      coverGradient: game?.coverGradient ?? null,
    };
  });

  return apiOk({ tribe: { ...MOCK_TRIBE, mostPlayedGames } });
}
