import { MOCK_USER } from "@/lib/mock/currentUser";
import { MOCK_PLATFORM_ACCOUNTS } from "@/lib/mock/platformAccounts";
import { MOCK_GAMES } from "@/lib/mock/games";
import { MOCK_SIGNATURE_GAMES, MOCK_FRIENDS_COMPARISON } from "@/lib/mock/profile";
import { MOCK_TROPHY_CASE } from "@/lib/mock/achievements";
import { MOCK_RECENT_ACTIVITY } from "@/lib/mock/activity";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const platformsConnected = MOCK_PLATFORM_ACCOUNTS.filter(
    (p) => p.status === "connected"
  ).map((p) => p.provider);

  const user = { ...MOCK_USER, platformsConnected };

  const signatureGames = MOCK_SIGNATURE_GAMES.map((sg) => {
    const game = MOCK_GAMES.find((g) => g.id === sg.gameId);
    return { ...sg, game };
  }).filter((sg) => sg.game);

  const trophyCase = MOCK_TROPHY_CASE.map((t) => {
    const game = MOCK_GAMES.find((g) => g.id === t.gameId);
    return { ...t, gameTitle: game?.canonicalTitle ?? "Unknown Game" };
  });

  return apiOk({
    user,
    signatureGames,
    trophyCase,
    friendsComparison: MOCK_FRIENDS_COMPARISON,
    recentActivity: MOCK_RECENT_ACTIVITY.slice(0, 5),
  });
}
