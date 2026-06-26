import { MOCK_TRIBE_RANKINGS } from "@/lib/mock/tribes";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET(request) {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || MOCK_TRIBE_RANKINGS.length;

  const rankings = [...MOCK_TRIBE_RANKINGS]
    .sort((a, b) => b.totalL9Points - a.totalL9Points)
    .slice(0, limit)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  const currentUserTribeRank = rankings.find((t) => t.isCurrentUserTribe) || null;

  return apiOk({ rankings, currentUserTribeRank });
}
