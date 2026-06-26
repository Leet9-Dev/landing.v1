import { MOCK_TRIBE, MOCK_TRIBE_MEMBERS } from "@/lib/mock/tribe";
import { MOCK_GAMES } from "@/lib/mock/games";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET(request, { params }) {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const { tribeId } = await params;

  if (tribeId !== MOCK_TRIBE.id) {
    return apiError("TRIBE_NOT_FOUND", "Tribe not found", 404);
  }

  // Join each member's last-played game title from canonical game data.
  const members = MOCK_TRIBE_MEMBERS.map((m) => {
    const game = MOCK_GAMES.find((g) => g.id === m.lastPlayedGameId);
    return { ...m, lastPlayedGameTitle: game?.canonicalTitle ?? null };
  });

  return apiOk({ members });
}
