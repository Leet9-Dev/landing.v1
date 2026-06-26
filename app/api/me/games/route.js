import { MOCK_GAMES } from "@/lib/mock/games";
import { MOCK_USER_GAMES } from "@/lib/mock/userGames";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET(request) {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const source = searchParams.get("source") || "";
  const sort = searchParams.get("sort") || "lastPlayed";
  const inProfileParam = searchParams.get("inProfile");

  let games = Object.values(MOCK_USER_GAMES)
    .map((ug) => {
      const game = MOCK_GAMES.find((g) => g.id === ug.gameId);
      return game ? { ...ug, game } : null;
    })
    .filter(Boolean);

  if (inProfileParam !== null) {
    const wantInProfile = inProfileParam === "true";
    games = games.filter((ug) => ug.inProfile === wantInProfile);
  }

  if (q) {
    games = games.filter((ug) => ug.game.canonicalTitle.toLowerCase().includes(q));
  }

  if (source) {
    games = games.filter((ug) => ug.sourcePlatforms.includes(source));
  }

  if (sort === "l9Points") {
    games = games.sort((a, b) => b.l9Points - a.l9Points);
  } else if (sort === "hoursPlayed") {
    games = games.sort((a, b) => b.hoursPlayed - a.hoursPlayed);
  } else if (sort === "mastery") {
    games = games.sort((a, b) => (b.masteryPct ?? 0) - (a.masteryPct ?? 0));
  } else if (sort === "lastPlayed") {
    games = games.sort((a, b) => new Date(b.lastPlayedAt) - new Date(a.lastPlayedAt));
  }

  return apiOk({ games, total: games.length });
}
