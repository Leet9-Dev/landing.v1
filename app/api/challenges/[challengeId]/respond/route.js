import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { sendGameChallengeAcceptedEmail } from "@/lib/email";
import { computeExpiresAt } from "@/lib/gamification/sprintEngine";

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

  // Accept: snapshot baseline stats for delta-based sprint tracking.
  // Both players' deltas start at 0 from this moment — only new progress counts.
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

  const challengerBaseline = {
    hours: Math.round((challengerGame?.playtimeHours ?? 0) * 10) / 10,
    achievements: challengerGame?.achievementsUnlocked ?? 0,
  };
  const challengedBaseline = {
    hours: Math.round((challengedGame?.playtimeHours ?? 0) * 10) / 10,
    achievements: challengedGame?.achievementsUnlocked ?? 0,
  };

  const acceptedAt = new Date();
  const expiresAt = computeExpiresAt(acceptedAt, challenge.sprintDuration ?? "72h");

  await prisma.$transaction([
    prisma.gameChallenge.update({
      where: { id: challengeId },
      data: {
        status: "ACTIVE",
        acceptedAt,
        expiresAt,
        challengerBaseline,
        challengedBaseline,
        // Keep legacy fields populated for v1 clients
        challengerStats: challengerBaseline,
        challengedStats: challengedBaseline,
      },
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
          sprintDuration: challenge.sprintDuration,
          sprintStat: challenge.sprintStat,
          expiresAt: expiresAt.toISOString(),
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

  return apiOk({
    status: "ACTIVE",
    expiresAt: expiresAt.toISOString(),
    sprintDuration: challenge.sprintDuration,
    sprintStat: challenge.sprintStat,
    challengerBaseline,
    challengedBaseline,
  });
}
