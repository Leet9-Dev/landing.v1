import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  return apiOk({ rankings: [], currentUserTribeRank: null });
}
