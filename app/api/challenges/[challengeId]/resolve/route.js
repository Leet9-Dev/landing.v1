import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { resolveSprintChallenge } from "@/lib/gamification/sprintEngine";

/**
 * POST /api/challenges/[challengeId]/resolve
 *
 * Resolves an ACTIVE sprint challenge: computes deltas since baseline,
 * determines winner, awards sprint XP, and transitions status to
 * COMPLETED | DRAW.
 *
 * Can be called by:
 *   1. Either participant (to voluntarily end early)
 *   2. A cron job when expiresAt has passed
 *
 * Idempotent — resolving an already-resolved challenge returns the
 * existing result without re-awarding XP.
 */
export async function POST(request, { params }) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { challengeId } = await params;
  const userId = session.user.id;

  const challenge = await prisma.gameChallenge.findUnique({
    where: { id: challengeId },
    select: {
      id: true,
      challengerId: true,
      challengedId: true,
      status: true,
      expiresAt: true,
      challengerDelta: true,
      challengedDelta: true,
      winnerId: true,
    },
  });

  if (!challenge) return apiError("NOT_FOUND", "Challenge not found.", 404);

  // Only participants can resolve.
  if (challenge.challengerId !== userId && challenge.challengedId !== userId) {
    return apiError("FORBIDDEN", "Only participants can resolve a challenge.", 403);
  }

  // Already resolved — return current state.
  if (["COMPLETED", "DRAW", "DECLINED", "EXPIRED"].includes(challenge.status)) {
    return apiOk({
      status: challenge.status,
      challengerDelta: challenge.challengerDelta,
      challengedDelta: challenge.challengedDelta,
      winnerId: challenge.winnerId,
    });
  }

  if (!["ACTIVE", "ACCEPTED"].includes(challenge.status)) {
    return apiError("NOT_ACTIVE", "Challenge must be ACTIVE to resolve.", 409);
  }

  const result = await resolveSprintChallenge(prisma, challengeId);

  // Notify both participants of the result.
  const opponentId = userId === challenge.challengerId ? challenge.challengedId : challenge.challengerId;
  await prisma.notification.create({
    data: {
      userId: opponentId,
      type: "CHALLENGE_RESOLVED",
      payload: {
        challengeId,
        status: result.status,
        winnerId: result.winnerId,
        challengerDelta: result.challengerDelta,
        challengedDelta: result.challengedDelta,
      },
    },
  }).catch(() => {});

  return apiOk(result);
}
