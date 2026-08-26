/**
 * GET /api/cron/nps-email
 *
 * Sends NPS survey emails to dormant users (no active session for 90+ days).
 * Skips users who already answered this month.
 * Capped at 50 emails per run to stay within Resend quotas.
 * Protected by CRON_SECRET.
 */

import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { sendNpsSurveyEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const BATCH_LIMIT = 50;
const DORMANT_DAYS = 90;

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const dormantCutoff = new Date(now.getTime() - DORMANT_DAYS * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Find users who have an email and whose most recent session expired before the dormant cutoff.
  // These are users who haven't been active for 90+ days.
  const dormantUsers = await prisma.user.findMany({
    where: {
      email: { not: null },
      // Has at least one session (real account, not just OAuth stub)
      sessions: { some: {} },
      // No active session (all sessions expired)
      NOT: { sessions: { some: { expires: { gte: now } } } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      sessions: {
        select: { expires: true },
        orderBy: { expires: "desc" },
        take: 1,
      },
    },
    take: BATCH_LIMIT * 3, // Over-fetch, filter in JS
  });

  // Keep only users whose last session expired 90+ days ago.
  const trulyDormant = dormantUsers.filter((u) => {
    const lastExpiry = u.sessions[0]?.expires;
    return lastExpiry && lastExpiry < dormantCutoff;
  });

  // Exclude users who already answered NPS this month.
  const dormantIds = trulyDormant.map((u) => u.id);
  const alreadyAnswered = await prisma.npsSurvey.findMany({
    where: {
      userId: { in: dormantIds },
      createdAt: { gte: startOfMonth, lt: startOfNextMonth },
    },
    select: { userId: true },
  });
  const answeredSet = new Set(alreadyAnswered.map((r) => r.userId));

  const targets = trulyDormant
    .filter((u) => !answeredSet.has(u.id))
    .slice(0, BATCH_LIMIT);

  const results = [];
  for (const user of targets) {
    try {
      await sendNpsSurveyEmail({ to: user.email, name: user.name || "Gamer" });
      results.push({ userId: user.id, sent: true });
    } catch (e) {
      results.push({ userId: user.id, sent: false, error: e?.message });
    }
  }

  return apiOk({ sent: results.filter((r) => r.sent).length, total: results.length });
}
