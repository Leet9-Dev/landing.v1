import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { sendGameChallengeAcceptedEmail } from "@/lib/email";

export async function POST(request, { params }) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { challengeId } = await params;
  const userId = session.user.id;

  const body = await request.json().catch(() => ({}));
  const { action } = body; // "accept" | "decline"
  if (!["accept", "decline"].includes(action)) {
    return apiError("INVALID_ACTION", "action must be 'accept' or 'decline'.", 400);
  }

  const challenge = await prisma.gameChallenge.findUnique({
    where: { id: challengeId },
    include: {
      challenger: { select: { id: true, name: true, email: true } },
      challenged: { select: { id: true, name: true } },
    },
  });

  if (!challenge) return apiError("NOT_FOUND", "Challenge not found.", 404);
  if (challenge.challengedId !== userId) return apiError("FORBIDDEN", "Only the challenged player can respond.", 403);
  if (challenge.status !== "PENDING") return apiError("ALREADY_RESOLVED", "This challenge has already been resolved.", 409);

  if (action === "decline") {
    await prisma.$transaction([
      prisma.gameChallenge.update({ where: { id: challengeId }, data: { status: "DECLINED" } }),
      prisma.notification.create({
        data: {
          userId: challenge.challengerId,
          type: "CHALLENGE_DECLINED",
          payload: {
            challengeId,
            challengedName: challenge.challenged.name || "Gamer",
            gameId: challenge.gameId,
            gameName: challenge.gameName,
          },
        },
      }),
    ]);
    return apiOk({ status: "DECLINED" });
  }

  // Accept: snapshot both users' stats for this game
  const [challengerGame, challengedGame] = await Promise.all([
    prisma.userGame.findUnique({
      where: { userId_canonicalGameId: { userId: challenge.challengerId, canonicalGameId: challenge.gameId } },
      select: { playtimeHours: true, achievementsUnlocked: true, trophiesUnlocked: true },
    }),
    prisma.userGame.findUnique({
      where: { userId_canonicalGameId: { userId: challenge.challengedId, canonicalGameId: challenge.gameId } },
      select: { playtimeHours: true, achievementsUnlocked: true, trophiesUnlocked: true },
    }),
  ]);

  const challengerStats = {
    hours: challengerGame ? Math.round(challengerGame.playtimeHours ?? 0) : 0,
    achievements: challengerGame?.achievementsUnlocked ?? 0,
    trophies: challengerGame?.trophiesUnlocked ?? 0,
  };
  const challengedStats = {
    hours: challengedGame ? Math.round(challengedGame.playtimeHours ?? 0) : 0,
    achievements: challengedGame?.achievementsUnlocked ?? 0,
    trophies: challengedGame?.trophiesUnlocked ?? 0,
  };

  await prisma.$transaction([
    prisma.gameChallenge.update({
      where: { id: challengeId },
      data: { status: "ACCEPTED", challengerStats, challengedStats },
    }),
    prisma.notification.create({
      data: {
        userId: challenge.challengerId,
        type: "CHALLENGE_ACCEPTED",
        payload: {
          challengeId,
          challengedName: challenge.challenged.name || "Gamer",
          gameId: challenge.gameId,
          gameName: challenge.gameName,
        },
      },
    }),
  ]);

  // Email the challenger
  if (challenge.challenger.email) {
    const challengeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com"}/app/challenges/${challengeId}`;
    await sendGameChallengeAcceptedEmail({
      to: challenge.challenger.email,
      challengedName: challenge.challenged.name || "Gamer",
      gameName: challenge.gameName,
      challengeUrl,
    }).catch(() => {});
  }

  return apiOk({ status: "ACCEPTED", challengerStats, challengedStats });
}
