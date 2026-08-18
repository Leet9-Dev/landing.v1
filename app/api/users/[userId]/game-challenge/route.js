import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { sendGameChallengeEmail } from "@/lib/email";
import { MOCK_GAMES } from "@/lib/mock/games";

const MOCK_GAMES_MAP = Object.fromEntries(MOCK_GAMES.map((g) => [g.id, g]));

export async function POST(request, { params }) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { userId: targetId } = await params;
  const senderId = session.user.id;

  if (senderId === targetId) {
    return apiError("SELF_CHALLENGE", "You cannot challenge yourself.", 400);
  }

  const body = await request.json().catch(() => ({}));
  const { gameId } = body;
  if (!gameId) return apiError("MISSING_GAME", "gameId is required.", 400);

  const gameMeta = MOCK_GAMES_MAP[gameId];
  if (!gameMeta) return apiError("UNKNOWN_GAME", "Game not found.", 404);

  // Verify both users have a UserGame record for this game
  const [senderGame, targetGame] = await Promise.all([
    prisma.userGame.findUnique({ where: { userId_canonicalGameId: { userId: senderId, canonicalGameId: gameId } } }),
    prisma.userGame.findUnique({ where: { userId_canonicalGameId: { userId: targetId, canonicalGameId: gameId } } }),
  ]);

  if (!senderGame || !targetGame) {
    return apiError("MISSING_DATA", "Both players need data for this game.", 400);
  }

  // Check for existing PENDING challenge between these two for this game
  const existing = await prisma.gameChallenge.findFirst({
    where: {
      gameId,
      status: "PENDING",
      OR: [
        { challengerId: senderId, challengedId: targetId },
        { challengerId: targetId, challengedId: senderId },
      ],
    },
  });
  if (existing) {
    return apiError("CHALLENGE_EXISTS", "A challenge for this game is already pending.", 409);
  }

  const [target, sender] = await Promise.all([
    prisma.user.findUnique({ where: { id: targetId }, select: { email: true, name: true } }),
    prisma.user.findUnique({ where: { id: senderId }, select: { name: true } }),
  ]);

  if (!target) return apiError("NOT_FOUND", "Target user not found.", 404);

  const challenge = await prisma.gameChallenge.create({
    data: {
      challengerId: senderId,
      challengedId: targetId,
      gameId,
      gameName: gameMeta.canonicalTitle,
    },
  });

  // Create in-app notification for the challenged user
  await prisma.notification.create({
    data: {
      userId: targetId,
      type: "CHALLENGE_RECEIVED",
      payload: {
        challengeId: challenge.id,
        challengerName: sender.name || "Gamer",
        challengerId: senderId,
        gameId,
        gameName: gameMeta.canonicalTitle,
        gameCoverUrl: gameMeta.coverImageUrl ?? null,
      },
    },
  });

  // Send email notification
  if (target.email) {
    const challengeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com"}/app/challenges/${challenge.id}`;
    await sendGameChallengeEmail({
      to: target.email,
      challengerName: sender.name || "Gamer",
      gameName: gameMeta.canonicalTitle,
      challengeUrl,
    }).catch(() => {});
  }

  return apiOk({ challenge: { id: challenge.id, status: challenge.status } });
}
