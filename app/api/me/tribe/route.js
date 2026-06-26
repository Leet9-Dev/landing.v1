import { MOCK_TRIBE, MOCK_CURRENT_MEMBER, MOCK_TRIBE_PERMISSIONS } from "@/lib/mock/tribe";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  // Return the tribe core (without the heavy most-played list — that comes from
  // the tribe detail endpoint), plus the current user's member record and the
  // permissions object (all actions deferred for this phase).
  const { mostPlayedGames, ...tribe } = MOCK_TRIBE;

  return apiOk({
    tribe,
    currentMember: MOCK_CURRENT_MEMBER ?? null,
    permissions: MOCK_TRIBE_PERMISSIONS,
  });
}
