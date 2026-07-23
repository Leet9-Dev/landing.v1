/**
 * GET  /api/me/reviews — list the current user's game reviews
 * POST /api/me/reviews — create or update a game review
 *
 * Body: { gameId: string, rating: 1-10, content: string }
 */

import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { emitGameReviewedEvent } from "@/lib/gamification/engine";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const reviews = await prisma.gameReview.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, gameId: true, rating: true, content: true, createdAt: true, updatedAt: true },
  });

  return apiOk({ reviews });
}

export async function POST(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const body = await request.json().catch(() => ({}));

  const gameId = typeof body.gameId === "string" ? body.gameId.trim() : null;
  const rating = typeof body.rating === "number" ? Math.round(body.rating) : null;
  const content = typeof body.content === "string" ? body.content.trim() : null;

  if (!gameId) return apiError("MISSING_GAME_ID", "gameId is required.", 400);
  if (!rating || rating < 1 || rating > 10) return apiError("INVALID_RATING", "Rating must be 1–10.", 400);
  if (!content || content.length < 10) return apiError("CONTENT_TOO_SHORT", "Review must be at least 10 characters.", 400);
  if (content.length > 5000) return apiError("CONTENT_TOO_LONG", "Review must be under 5000 characters.", 400);

  const isNew = !(await prisma.gameReview.findUnique({ where: { userId_gameId: { userId, gameId } } }));

  await prisma.gameReview.upsert({
    where: { userId_gameId: { userId, gameId } },
    create: { userId, gameId, rating, content },
    update: { rating, content },
  });

  if (isNew) {
    const totalReviews = await prisma.gameReview.count({ where: { userId } });
    emitGameReviewedEvent(prisma, userId, gameId, totalReviews).catch(() => {});
  }

  return apiOk({ gameId, rating, content, isNew });
}
