import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { resolveSprintChallenge } from "@/lib/gamification/sprintEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/resolve-challenges
 *
 * Resolves all ACTIVE sprint challenges whose expiresAt has passed.
 * Intended to be called by a Vercel Cron Job (every 15 minutes).
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const expired = await prisma.gameChallenge.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: new Date() },
    },
    select: { id: true, challengerId: true, challengedId: true },
  }).catch(() => []);

  const results = [];
  for (const challenge of expired) {
    try {
      const result = await resolveSprintChallenge(prisma, challenge.id);

      // Notify both participants.
      await prisma.notification.createMany({
        data: [challenge.challengerId, challenge.challengedId].map((userId) => ({
          userId,
          type: "CHALLENGE_RESOLVED",
          payload: {
            challengeId: challenge.id,
            status: result.status,
            winnerId: result.winnerId,
            challengerDelta: result.challengerDelta,
            challengedDelta: result.challengedDelta,
          },
        })),
        skipDuplicates: true,
      }).catch(() => {});

      results.push({ id: challenge.id, status: result.status });
    } catch (e) {
      results.push({ id: challenge.id, error: e?.message ?? "failed" });
    }
  }

  return apiOk({ resolved: results.length, results });
}
