import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { MOCK_GAMES } from "@/lib/mock/games";

// Dev-only endpoint to seed mock UserGame records for testing the 1v1 challenge flow.
// Disabled in production.
export async function POST(request) {
  if (process.env.NODE_ENV === "production") {
    return apiError("FORBIDDEN", "Not available in production.", 403);
  }

  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  // Seed the first 5 mock games for this user
  const gamesToSeed = MOCK_GAMES.slice(0, 5);

  await Promise.all(
    gamesToSeed.map((g) =>
      prisma.userGame.upsert({
        where: { userId_canonicalGameId: { userId, canonicalGameId: g.id } },
        create: {
          userId,
          canonicalGameId: g.id,
          sourceProvider: "steam",
          playtimeHours: Math.round(Math.random() * 200 + 10),
          achievementsUnlocked: Math.round(Math.random() * 50 + 5),
          trophiesUnlocked: Math.round(Math.random() * 20),
          firstDetectedAt: new Date(),
          lastDetectedAt: new Date(),
        },
        update: {},
      })
    )
  );

  return apiOk({ seeded: gamesToSeed.map((g) => g.canonicalTitle) });
}
