import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { MOCK_GAMES } from "@/lib/mock/games";

const MOCK_GAMES_MAP = Object.fromEntries(MOCK_GAMES.map((g) => [g.id, g]));

export async function GET(request, { params }) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { challengeId } = await params;
  const userId = session.user.id;

  const challenge = await prisma.gameChallenge.findUnique({
    where: { id: challengeId },
    include: {
      challenger: { select: { id: true, name: true, image: true } },
      challenged: { select: { id: true, name: true, image: true } },
    },
  });

  if (!challenge) return apiError("NOT_FOUND", "Challenge not found.", 404);

  // Only participants can view
  if (challenge.challengerId !== userId && challenge.challengedId !== userId) {
    return apiError("FORBIDDEN", "You are not part of this challenge.", 403);
  }

  const gameMeta = MOCK_GAMES_MAP[challenge.gameId] ?? null;

  return apiOk({
    challenge: {
      id: challenge.id,
      gameId: challenge.gameId,
      gameName: challenge.gameName,
      gameCoverUrl: gameMeta?.coverImageUrl ?? null,
      gameStudio: gameMeta?.studio ?? null,
      status: challenge.status,
      createdAt: challenge.createdAt,
      challenger: {
        id: challenge.challenger.id,
        name: challenge.challenger.name || "Gamer",
        avatarUrl: challenge.challenger.image ?? null,
        stats: challenge.challengerStats ?? null,
      },
      challenged: {
        id: challenge.challenged.id,
        name: challenge.challenged.name || "Gamer",
        avatarUrl: challenge.challenged.image ?? null,
        stats: challenge.challengedStats ?? null,
      },
      myRole: challenge.challengerId === userId ? "challenger" : "challenged",
    },
  });
}
