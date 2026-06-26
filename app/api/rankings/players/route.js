import { MOCK_PLAYER_RANKINGS } from "@/lib/mock/rankings";
import { MOCK_USER } from "@/lib/mock/currentUser";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET(request) {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "global";
  const limit = Number(searchParams.get("limit")) || MOCK_PLAYER_RANKINGS.length;

  let rankings = [...MOCK_PLAYER_RANKINGS];

  if (scope === "friends") {
    rankings = rankings.filter((p) => p.isFriend || p.isCurrentUser);
  } else if (scope === "tribe") {
    rankings = rankings.filter((p) => p.tribeTag === MOCK_USER.tribeTag);
  }

  // Re-rank within the filtered scope so the displayed rank matches the list.
  rankings = rankings
    .sort((a, b) => b.l9Points - a.l9Points)
    .slice(0, limit)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const currentUserRank = rankings.find((p) => p.isCurrentUser) || null;

  return apiOk({ rankings, currentUserRank }, { scope });
}
