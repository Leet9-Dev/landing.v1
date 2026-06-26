import { MOCK_GAMES } from "@/lib/mock/games";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET(request) {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "l9Points";
  const source = searchParams.get("source") || "";
  const limit = Number(searchParams.get("limit")) || MOCK_GAMES.length;

  let games = [...MOCK_GAMES];

  if (source) {
    games = games.filter((g) => g.sourcePlatforms.includes(source));
  }

  if (sort === "players") {
    games.sort((a, b) => b.communityPlayerCount - a.communityPlayerCount);
  } else if (sort === "achievements") {
    games.sort((a, b) => b.communityAchievements - a.communityAchievements);
  } else if (sort === "hours") {
    games.sort((a, b) => b.communityHours - a.communityHours);
  } else if (sort === "trending") {
    games.sort((a, b) => {
      if (a.trendingRank === null && b.trendingRank === null) return 0;
      if (a.trendingRank === null) return 1;
      if (b.trendingRank === null) return -1;
      return a.trendingRank - b.trendingRank;
    });
  } else {
    // default: l9Points
    games.sort((a, b) => b.communityL9Points - a.communityL9Points);
  }

  const rankings = games.slice(0, limit).map((game, i) => ({
    rank: i + 1,
    gameId: game.id,
    game,
    l9Points: game.communityL9Points,
    playerCount: game.communityPlayerCount,
    achievementsCount: game.communityAchievements,
    hoursPlayed: game.communityHours,
    rating: game.communityRating,
    trendingRank: game.trendingRank,
    recentlyDetected: game.recentlyDetected,
  }));

  return apiOk({ rankings }, { sort });
}
