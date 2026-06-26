import { MOCK_GAMES } from "@/lib/mock/games";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";
import { MOCK_USER_GAMES } from "@/lib/mock/userGames";
import { apiOk, apiError } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { gameId } = await params;

  const game =
    MOCK_GAMES.find((g) => g.id === gameId) ||
    MOCK_GAMES.find((g) => g.slug === gameId);

  if (!game) {
    return apiError("GAME_NOT_FOUND", "Game not found", 404);
  }

  const externalSources = MOCK_EXTERNAL_SOURCES.filter(
    (s) => s.gameId === game.id
  );

  const currentUserGame = MOCK_USER_GAMES[game.id] || null;

  return apiOk({ game, externalSources, currentUserGame });
}
