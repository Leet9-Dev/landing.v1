/**
 * GET  /api/me/nps  — eligibility check
 * POST /api/me/nps  — submit NPS score
 */

import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Check if already answered this calendar month.
  const startOfMonth = new Date(year, month, 1);
  const startOfNextMonth = new Date(year, month + 1, 1);

  const existing = await prisma.npsSurvey.findFirst({
    where: { userId, createdAt: { gte: startOfMonth, lt: startOfNextMonth } },
    select: { id: true },
  });

  if (existing) {
    return apiOk({ eligible: false, reason: "already_answered" });
  }

  // Count active sessions as a proxy for recent logins (one session = one login).
  const activeSessions = await prisma.session.count({
    where: { userId, expires: { gte: now } },
  });

  if (activeSessions < 2) {
    return apiOk({ eligible: false, reason: "not_enough_logins" });
  }

  return apiOk({ eligible: true });
}

export async function POST(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const body = await request.json().catch(() => ({}));

  const score = typeof body.score === "number" ? Math.round(body.score) : null;
  const comment = typeof body.comment === "string" ? body.comment.trim() : null;
  const channel = body.channel === "email" ? "email" : "in_app";

  if (score === null || score < 0 || score > 10) {
    return apiError("INVALID_SCORE", "Score must be 0–10.", 400);
  }
  if (comment && comment.length > 2000) {
    return apiError("COMMENT_TOO_LONG", "Comment must be under 2000 characters.", 400);
  }

  // Enforce once-per-calendar-month.
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const existing = await prisma.npsSurvey.findFirst({
    where: { userId, createdAt: { gte: startOfMonth, lt: startOfNextMonth } },
    select: { id: true },
  });

  if (existing) {
    return apiError("ALREADY_ANSWERED_THIS_MONTH", "You already submitted your feedback this month.", 429);
  }

  await prisma.npsSurvey.create({
    data: { userId, score, comment: comment || null, channel },
  });

  return apiOk({ submitted: true });
}
