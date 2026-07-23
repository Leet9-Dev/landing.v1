/**
 * GET  /api/me/invites — list the current user's invite codes
 * POST /api/me/invites — generate a new invite code
 *
 * Codes are single-use. Points are awarded to the inviter when
 * an invitee registers using the code.
 */

import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { emitFriendInvitedEvent } from "@/lib/gamification/engine";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const codes = await prisma.inviteCode.findMany({
    where: { inviterId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      code: true,
      usedAt: true,
      createdAt: true,
      invitee: { select: { name: true } },
    },
  });

  return apiOk({ codes: codes.map((c) => ({
    code: c.code,
    used: !!c.usedAt,
    usedAt: c.usedAt,
    inviteeName: c.invitee?.name ?? null,
    createdAt: c.createdAt,
  })) });
}

export async function POST() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  // Rate-limit: max 20 unused codes at a time.
  const unusedCount = await prisma.inviteCode.count({
    where: { inviterId: userId, usedAt: null },
  });
  if (unusedCount >= 20) {
    return apiError("TOO_MANY_INVITES", "You have too many unused invite codes. Share existing ones first.", 429);
  }

  let code;
  let attempts = 0;
  while (attempts < 5) {
    code = generateCode();
    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (!existing) break;
    attempts++;
  }
  if (!code) return apiError("CODE_GENERATION_FAILED", "Could not generate a unique code. Try again.", 500);

  await prisma.inviteCode.create({ data: { code, inviterId: userId } });

  emitFriendInvitedEvent(prisma, userId, code).catch(() => {});

  return apiOk({ code });
}
