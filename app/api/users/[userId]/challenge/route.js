import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { challengeRatelimit } from "@/lib/ratelimit";
import { sendChallengeEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

export async function POST(request, { params }) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { userId: targetId } = await params;
  if (!targetId) return apiError("MISSING_ID", "Target user ID required.", 400);

  const senderId = session.user.id;
  if (senderId === targetId) return apiError("SELF_CHALLENGE", "Cannot challenge yourself.", 400);

  // Rate limit per sender→target pair: 2 per 24h
  const rlKey = `challenge:${senderId}:${targetId}`;
  const { success } = await challengeRatelimit.limit(rlKey);
  if (!success) return apiError("RATE_LIMITED", "You already sent a challenge to this player recently.", 429);

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { email: true, name: true },
  });

  if (!target?.email) return apiError("NOT_FOUND", "User not found.", 404);

  const challengerName = session.user.name || "Un giocatore Leet9";
  const targetProfileUrl = `${BASE_URL}/app/profile`;

  await sendChallengeEmail({ to: target.email, challengerName, targetProfileUrl });

  return apiOk({ sent: true });
}
