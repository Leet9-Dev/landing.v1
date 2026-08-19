import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { MOCK_GAMES } from "@/lib/mock/games";

const ADMIN_EMAILS = ["palesamattia@gmail.com"];
// Known admin userIds (used as fallback when email is null, e.g. Steam-only accounts)
const ADMIN_USER_IDS = ["cmqtn7n0r00001e7zuylpd4zd"];

export async function POST(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  // Check email from DB, then fall back to session email (populated for Google/credentials but not Steam)
  const emailToCheck = dbUser?.email ?? session.user?.email;
  const isAdmin = ADMIN_EMAILS.includes(emailToCheck) || ADMIN_USER_IDS.includes(session.user.id);
  if (!isAdmin) {
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
