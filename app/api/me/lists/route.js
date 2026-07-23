/**
 * GET  /api/me/lists — list the current user's game lists
 * POST /api/me/lists — create a new game list
 *
 * Body: { title: string, items: [{ gameId: string, rank: number }] }
 */

import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { emitListCreatedEvent } from "@/lib/gamification/engine";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const lists = await prisma.gameList.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { rank: "asc" } } },
  });

  return apiOk({ lists });
}

export async function POST(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const body = await request.json().catch(() => ({}));

  const title = typeof body.title === "string" ? body.title.trim() : null;
  const items = Array.isArray(body.items) ? body.items : [];

  if (!title || title.length < 1 || title.length > 100) {
    return apiError("INVALID_TITLE", "List title must be 1–100 characters.", 400);
  }
  if (items.length < 1 || items.length > 100) {
    return apiError("INVALID_ITEMS", "A list must have 1–100 games.", 400);
  }

  const validItems = items
    .filter((item) => typeof item.gameId === "string" && typeof item.rank === "number")
    .map((item) => ({ gameId: item.gameId.trim(), rank: Math.round(item.rank) }));

  const list = await prisma.gameList.create({
    data: {
      userId,
      title,
      items: { create: validItems },
    },
    include: { items: { orderBy: { rank: "asc" } } },
  });

  emitListCreatedEvent(prisma, userId, list.id).catch(() => {});

  return apiOk({ list });
}
