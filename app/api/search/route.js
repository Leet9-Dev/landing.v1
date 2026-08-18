import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { MOCK_GAMES } from "@/lib/mock/games";

export async function GET(request) {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return apiError("TOO_SHORT", "Query must be at least 2 characters.", 400);

  const term = q.toLowerCase();

  const [playerRows] = await Promise.all([
    prisma.user.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, image: true },
      take: 6,
    }),
  ]);

  const players = playerRows.map((u) => ({
    id: u.id,
    name: u.name || "Gamer",
    avatarUrl: u.image ?? null,
    initials: (u.name || "G").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
  }));

  const games = MOCK_GAMES
    .filter((g) => g.canonicalTitle.toLowerCase().includes(term) || g.studio?.toLowerCase().includes(term))
    .slice(0, 5)
    .map((g) => ({
      id: g.id,
      title: g.canonicalTitle,
      studio: g.studio ?? null,
      coverImageUrl: g.coverImageUrl ?? null,
    }));

  return apiOk({ players, games });
}
