/**
 * POST   /api/me/follow/[userId] — follow another user
 * DELETE /api/me/follow/[userId] — unfollow
 */

import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { emitUserFollowedEvent, emitFollowerGainedEvent } from "@/lib/gamification/engine";

export async function POST(request, { params }) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const followerId = session.user.id;
  const followingId = params.userId;

  if (followerId === followingId) {
    return apiError("SELF_FOLLOW", "You cannot follow yourself.", 400);
  }

  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) return apiError("USER_NOT_FOUND", "User not found.", 404);

  try {
    await prisma.userFollow.create({ data: { followerId, followingId } });
  } catch (e) {
    if (e.code === "P2002") return apiError("ALREADY_FOLLOWING", "You are already following this user.", 409);
    throw e;
  }

  const [totalFollowing, totalFollowers] = await Promise.all([
    prisma.userFollow.count({ where: { followerId } }),
    prisma.userFollow.count({ where: { followingId } }),
  ]);

  emitUserFollowedEvent(prisma, followerId, totalFollowing).catch(() => {});
  emitFollowerGainedEvent(prisma, followingId, totalFollowers).catch(() => {});

  return apiOk({ following: true });
}

export async function DELETE(request, { params }) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const followerId = session.user.id;
  const followingId = params.userId;

  await prisma.userFollow.deleteMany({ where: { followerId, followingId } });

  return apiOk({ following: false });
}
