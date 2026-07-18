import { MOCK_GAMES } from "@/lib/mock/games";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { computeL9Points } from "@/lib/scoring/l9Points";

export async function POST(request, { params }) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { gameId } = await params;
  const userId = session.user.id;

  const game = MOCK_GAMES.find((g) => g.id === gameId) || MOCK_GAMES.find((g) => g.slug === gameId);
  if (!game) {
    return apiError("GAME_NOT_FOUND", "Game not found", 404);
  }

  const now = new Date();

  const userGame = await prisma.userGame.upsert({
    where: { userId_canonicalGameId: { userId, canonicalGameId: game.id } },
    create: {
      userId,
      canonicalGameId: game.id,
      sourceProvider: "manual",
      firstDetectedAt: now,
      lastDetectedAt: now,
      playtimeHours: 0,
      sourceConfidence: "low",
    },
    update: {
      lastDetectedAt: now,
    },
    select: {
      playtimeHours: true,
      achievementsUnlocked: true,
      firstDetectedAt: true,
      sourceProvider: true,
    },
  });

  const hoursPlayed = userGame.playtimeHours ?? 0;
  const achievementsUnlocked = userGame.achievementsUnlocked ?? 0;

  return apiOk({
    userGame: {
      gameId: game.id,
      inLibrary: true,
      inProfile: true,
      hoursPlayed: Math.round(hoursPlayed * 10) / 10,
      l9Points: computeL9Points({ playtimeHours: hoursPlayed, achievementsUnlocked }),
      achievementsUnlocked,
      achievementsTotal: 0,
      masteryPct: 0,
      lastPlayedAt: null,
      addedToProfileAt: now.toISOString(),
    },
  });
}
