import { MOCK_GAMES } from "@/lib/mock/games";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";
import { buildSourcePlatformMap } from "@/lib/platforms/canonicalMatching";
import { fetchIgdbGamesBatch } from "@/lib/integrations/igdb/igdbMatcher";
import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";

// Deterministic display player count — gives each game a unique number in range 4509–13620.
// Added to real DB count so actual community growth shows on top.
function mockPlayerBase(gameId) {
  let h = 5381;
  for (let i = 0; i < gameId.length; i++) {
    h = (((h << 5) + h) + gameId.charCodeAt(i)) | 0;
  }
  return 4509 + (Math.abs(h) % (13620 - 4509 + 1));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const source = searchParams.get("source") || "";
  const sort = searchParams.get("sort") || "trending";
  const recentOnly = searchParams.get("recentOnly") === "true";
  const trendingOnly = searchParams.get("trendingOnly") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  // Discovery is platform-agnostic. Each canonical game appears once; its source
  // badges are derived from normalized GameExternalSource records.
  // Sources: MOCK_GAMES (legacy catalogue) + IGDB-matched games from DB.
  const sourceMap = buildSourcePlatformMap(MOCK_EXTERNAL_SOURCES);

  // Pull IGDB-matched external sources from DB (cached matches from real syncs).
  const igdbSources = await prisma.gameExternalSource.findMany({
    where: { status: "matched", canonicalGameId: { startsWith: "igdb:" } },
    select: { provider: true, externalGameId: true, canonicalGameId: true },
  }).catch(() => []);

  // Build platform badges for IGDB canonical games from DB sources.
  const igdbPlatformMap = new Map();
  for (const s of igdbSources) {
    const rawPlatform = s.provider.replace("igdb_", "");
    if (!igdbPlatformMap.has(s.canonicalGameId)) igdbPlatformMap.set(s.canonicalGameId, new Set());
    igdbPlatformMap.get(s.canonicalGameId).add(rawPlatform);
  }

  // Deduplicated IGDB canonical IDs not already covered by MOCK_GAMES.
  const mockIds = new Set(MOCK_GAMES.map((g) => g.id));
  const newIgdbIds = [...new Set(igdbSources.map((s) => s.canonicalGameId))].filter((id) => !mockIds.has(id));
  const igdbGameMap = await fetchIgdbGamesBatch(newIgdbIds);

  // Real community stats aggregated from UserGame rows for all canonical IDs.
  const allTrackedIds = [...new Set([...MOCK_GAMES.map((g) => g.id), ...newIgdbIds])];
  const communityStats = await prisma.userGame.groupBy({
    by: ["canonicalGameId"],
    where: { canonicalGameId: { in: allTrackedIds } },
    _count: { userId: true },
    _sum: { playtimeHours: true },
  }).catch(() => []);

  const communityStatsMap = new Map(
    communityStats.map((row) => [
      row.canonicalGameId,
      { playerCount: row._count.userId, totalHours: Math.round((row._sum.playtimeHours ?? 0) * 10) / 10 },
    ])
  );

  const igdbGames = [...igdbGameMap.values()].map((g) => {
    const stats = communityStatsMap.get(g.id) ?? { playerCount: 0, totalHours: 0 };
    return {
      ...g,
      sourcePlatforms: [...(igdbPlatformMap.get(g.id) ?? [])],
      communityPlayerCount: stats.playerCount,
      communityHours: stats.totalHours,
    };
  });

  let games = [
    ...MOCK_GAMES.map((g) => {
      const stats = communityStatsMap.get(g.id) ?? { playerCount: 0, totalHours: 0 };
      return {
        ...g,
        sourcePlatforms: sourceMap.get(g.id) ?? g.sourcePlatforms,
        communityPlayerCount: mockPlayerBase(g.id) + stats.playerCount,
        communityHours: (g.communityHours ?? 0) + stats.totalHours,
      };
    }),
    ...igdbGames,
  ];

  if (q) {
    games = games.filter(
      (g) =>
        g.canonicalTitle.toLowerCase().includes(q) ||
        g.studio.toLowerCase().includes(q) ||
        g.publisher.toLowerCase().includes(q) ||
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

  const allGames = [
    ...MOCK_GAMES,
    ...igdbGames,
  ];
  const stats = {
    totalGames: allGames.length,
    totalPlayers: allGames.reduce((s, g) => s + (g.communityPlayerCount ?? 0), 0),
    totalL9Points: allGames.reduce((s, g) => s + (g.communityL9Points ?? 0), 0),
    totalHours: allGames.reduce((s, g) => s + (g.communityHours ?? 0), 0),
  };

  const total = games.length;
  const offset = (page - 1) * limit;
  const pagedGames = games.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return apiOk({ games: pagedGames, stats, total, page, limit, hasMore }, { _cacheSeconds: 60 });
}
