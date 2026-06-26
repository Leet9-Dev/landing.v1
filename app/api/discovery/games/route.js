import { MOCK_GAMES } from "@/lib/mock/games";
import { apiOk } from "@/lib/api/response";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const source = searchParams.get("source") || "";
  const sort = searchParams.get("sort") || "trending";
  const recentOnly = searchParams.get("recentOnly") === "true";
  const trendingOnly = searchParams.get("trendingOnly") === "true";

  let games = [...MOCK_GAMES];

  if (q) {
    games = games.filter(
      (g) =>
        g.canonicalTitle.toLowerCase().includes(q) ||
        g.studio.toLowerCase().includes(q) ||
        g.genres.some((genre) => genre.toLowerCase().includes(q)) ||
        g.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  if (source) {
    games = games.filter((g) => g.sourcePlatforms.includes(source));
  }

  if (recentOnly) {
    games = games.filter((g) => g.recentlyDetected);
  }

  if (trendingOnly) {
    games = games.filter((g) => g.trendingRank !== null);
  }

  if (sort === "trending") {
    games = games.sort((a, b) => {
      if (a.trendingRank === null && b.trendingRank === null) return 0;
      if (a.trendingRank === null) return 1;
      if (b.trendingRank === null) return -1;
      return a.trendingRank - b.trendingRank;
    });
  } else if (sort === "rating") {
    games = games.sort((a, b) => b.communityRating - a.communityRating);
  } else if (sort === "players") {
    games = games.sort((a, b) => b.communityPlayerCount - a.communityPlayerCount);
  } else if (sort === "recent") {
    games = games.sort((a, b) => new Date(b.lastDetectedAt) - new Date(a.lastDetectedAt));
  }

  const stats = {
    totalGames: MOCK_GAMES.length,
    totalPlayers: MOCK_GAMES.reduce((s, g) => s + g.communityPlayerCount, 0),
    totalL9Points: MOCK_GAMES.reduce((s, g) => s + g.communityL9Points, 0),
    totalHours: MOCK_GAMES.reduce((s, g) => s + g.communityHours, 0),
  };

  return apiOk({ games, stats, total: games.length });
}
