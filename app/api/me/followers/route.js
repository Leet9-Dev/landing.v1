/**
 * GET /api/me/followers — list users who follow the current user
 * GET /api/me/followers?type=following — list users the current user follows
 */

import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const type = new URL(request.url).searchParams.get("type");

  if (type === "following") {
    const rows = await prisma.userFollow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: "desc" },
      select: { following: { select: { id: true, name: true, image: true } }, createdAt: true },
    });
    return apiOk({ users: rows.map((r) => ({ ...r.following, followedAt: r.createdAt })) });
  }

  const rows = await prisma.userFollow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: "desc" },
    select: { follower: { select: { id: true, name: true, image: true } }, createdAt: true },
  });
  return apiOk({ users: rows.map((r) => ({ ...r.follower, followedAt: r.createdAt })) });
}
