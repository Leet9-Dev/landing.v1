import { MOCK_GAMES } from "@/lib/mock/games";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { computeL9Points } from "@/lib/scoring/l9Points";

export async function GET(request, { params }) {
  const { gameId } = await params;
  const { session } = await requireSession();

  const game =
    MOCK_GAMES.find((g) => g.id === gameId) ||
    MOCK_GAMES.find((g) => g.slug === gameId);

  if (!game) {
    return apiError("GAME_NOT_FOUND", "Game not found", 404);
  }

  const externalSources = MOCK_EXTERNAL_SOURCES.filter((s) => s.gameId === game.id);

  const realPlayerCount = await prisma.userGame.count({ where: { canonicalGameId: game.id } });
  const displayGame = realPlayerCount >= 500
    ? { ...game, communityPlayerCount: realPlayerCount }
    : game;

  let currentUserGame = null;
  if (session?.user?.id) {
    const ug = await prisma.userGame.findUnique({
      where: { userId_canonicalGameId: { userId: session.user.id, canonicalGameId: game.id } },
      select: {
        playtimeHours: true,
        achievementsUnlocked: true,
        firstDetectedAt: true,
        lastDetectedAt: true,
        sourceProvider: true,
      },
    });
    if (ug) {
      const hoursPlayed = ug.playtimeHours ?? 0;
      const achievementsUnlocked = ug.achievementsUnlocked ?? 0;
      currentUserGame = {
        inLibrary: true,
        inProfile: true,
        hoursPlayed: Math.round(hoursPlayed * 10) / 10,
        l9Points: computeL9Points({ playtimeHours: hoursPlayed, achievementsUnlocked }),
        achievementsUnlocked: achievementsUnlocked || null,
        achievementsTotal: null,
        masteryPct: null,
        lastPlayedAt: ug.lastDetectedAt?.toISOString() ?? null,
        sourceProvider: ug.sourceProvider,
      };
    }
  }

  let hasPaid = false;
  if (session?.user?.id) {
    const unlock = await prisma.comparisonUnlock.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    hasPaid = !!unlock;
  }

  let userReview = null;
  if (session?.user?.id) {
    const rev = await prisma.gameReview.findUnique({
      where: { userId_gameId: { userId: session.user.id, gameId: game.id } },
      select: { rating: true, content: true, updatedAt: true },
    });
    if (rev) userReview = { rating: rev.rating, content: rev.content, updatedAt: rev.updatedAt.toISOString() };
  }

  return apiOk({ game: displayGame, externalSources, currentUserGame, userReview, hasPaid }, { _cacheSeconds: 0 });
}
