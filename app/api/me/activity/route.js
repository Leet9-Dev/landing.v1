import { MOCK_RECENT_ACTIVITY } from "@/lib/mock/activity";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET(request) {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || MOCK_RECENT_ACTIVITY.length;

  return apiOk({ activity: MOCK_RECENT_ACTIVITY.slice(0, limit) });
}
