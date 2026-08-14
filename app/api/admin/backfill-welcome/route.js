import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { emitWelcomeEvent } from "@/lib/gamification/engine";

/**
 * One-time backfill: awards the 500-point welcome bonus to every user who
 * hasn't received it yet (idempotent — safe to call multiple times).
 *
 * Protected by ADMIN_SECRET env var.
 * Call with: POST /api/admin/backfill-welcome
 *            Authorization: Bearer <ADMIN_SECRET>
 */
export async function POST(request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return apiError("NOT_CONFIGURED", "ADMIN_SECRET env var not set.", 500);
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return apiError("UNAUTHORIZED", "Invalid or missing authorization.", 401);
  }

  // Find users who have NOT yet received the welcome event.
  const alreadyReceived = await prisma.gamificationEvent.findMany({
    where: { eventType: "user_registered" },
    select: { userId: true },
  });
  const alreadyIds = new Set(alreadyReceived.map((e) => e.userId));

  const users = await prisma.user.findMany({ select: { id: true } });
  const toBackfill = users.filter((u) => !alreadyIds.has(u.id));

  const results = [];
  for (const user of toBackfill) {
    try {
      const res = await emitWelcomeEvent(prisma, user.id);
      results.push({ userId: user.id, status: res.event ? "awarded" : "skipped" });
    } catch (err) {
      results.push({ userId: user.id, status: "error", message: err.message });
    }
  }

  return apiOk({
    total: users.length,
    alreadyHad: alreadyIds.size,
    processed: toBackfill.length,
    results,
  });
}
