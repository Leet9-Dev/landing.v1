import { MOCK_GAMES } from "@/lib/mock/games";
import { MOCK_USER_GAMES } from "@/lib/mock/userGames";
import { apiOk, apiError } from "@/lib/api/response";

export async function POST(request, { params }) {
  const { gameId } = await params;

  const game = MOCK_GAMES.find((g) => g.id === gameId);
  if (!game) {
    return apiError("GAME_NOT_FOUND", "Game not found", 404);
  }

  const existing = MOCK_USER_GAMES[gameId];

  const userGame = {
    gameId,
    inLibrary: existing?.inLibrary ?? true,
    inProfile: true,
    sourcePlatforms: existing?.sourcePlatforms ?? game.sourcePlatforms,
    l9Points: existing?.l9Points ?? 0,
    hoursPlayed: existing?.hoursPlayed ?? 0,
    achievementsUnlocked: existing?.achievementsUnlocked ?? 0,
    achievementsTotal: existing?.achievementsTotal ?? 0,
    masteryPct: existing?.masteryPct ?? 0,
    lastPlayedAt: existing?.lastPlayedAt ?? null,
    addedToProfileAt: new Date().toISOString(),
  };

  const activity = {
    type: "GAME_ADDED_TO_PROFILE",
    gameId,
    gameTitle: game.canonicalTitle,
    occurredAt: new Date().toISOString(),
  };

  return apiOk({ userGame, activity });
}
