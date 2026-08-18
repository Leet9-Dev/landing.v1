import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { MOCK_GAMES } from "@/lib/mock/games";

const ADMIN_EMAILS = ["palesamattia@gmail.com"];

export async function POST(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userEmail = session.user.email;
  if (!ADMIN_EMAILS.includes(userEmail)) {
    return apiError("FORBIDDEN", "Admin only.", 403);
  }

  // Optionally seed for a specific userId (defaults to self)
  const body = await request.json().catch(() => ({}));
  const targetUserId = body.userId || session.user.id;

  const gamesToSeed = MOCK_GAMES.slice(0, 8);

  await Promise.all(
    gamesToSeed.map((g) =>
      prisma.userGame.upsert({
        where: { userId_canonicalGameId: { userId: targetUserId, canonicalGameId: g.id } },
        create: {
          userId: targetUserId,
          canonicalGameId: g.id,
          sourceProvider: "steam",
          playtimeHours: Math.round(Math.random() * 300 + 20),
          achievementsUnlocked: Math.round(Math.random() * 60 + 5),
          trophiesUnlocked: Math.round(Math.random() * 25),
          firstDetectedAt: new Date(),
          lastDetectedAt: new Date(),
        },
        update: {},
      })
    )
  );

  return apiOk({ seeded: gamesToSeed.map((g) => g.canonicalTitle), forUser: targetUserId });
}
