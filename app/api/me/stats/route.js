import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  return apiOk({
    totalL9Points: null,
    totalHoursPlayed: null,
    totalGames: null,
    totalAchievements: null,
    platformSplit: [],
    topGamesByHours: [],
    mastery: null,
    momentum: null,
    rarityBreakdown: [],
    pointsBreakdown: [],
    gamerDna: null,
  });
}
