import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const [incoming, outgoing] = await Promise.all([
    prisma.gameChallenge.findMany({
      where: { challengedId: userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        challenger: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.gameChallenge.findMany({
      where: { challengerId: userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        challenged: { select: { id: true, name: true, image: true } },
      },
    }),
  ]);

  function formatChallenge(c, role) {
    const opponent = role === "challenger" ? c.challenged : c.challenger;
    return {
      id: c.id,
      gameId: c.gameId,
      gameName: c.gameName,
      status: c.status,
      role,
      opponentId: opponent.id,
      opponentName: opponent.name || "Gamer",
      opponentAvatarUrl: opponent.image ?? null,
      createdAt: c.createdAt,
    };
  }

  return apiOk({
    incoming: incoming.map((c) => formatChallenge(c, "challenged")),
    outgoing: outgoing.map((c) => formatChallenge(c, "challenger")),
  });
}
