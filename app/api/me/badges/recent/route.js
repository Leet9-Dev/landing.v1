import { requireSession } from "@/lib/api/auth";
import { apiOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

// Returns badges unlocked within the last 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const since = new Date(Date.now() - WINDOW_MS);

  const badges = await prisma.userBadge.findMany({
    where: { userId, unlockedAt: { gte: since } },
    orderBy: { unlockedAt: "desc" },
  });

  return apiOk({ badges });
}
