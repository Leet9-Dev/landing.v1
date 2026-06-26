import { MOCK_PLATFORM_DETECTED_GAMES } from "@/lib/mock/platformDetectedGames";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";
import { MOCK_GAMES } from "@/lib/mock/games";
import {
  normalizeDetectedGame,
  isIngestibleDetectedGame,
} from "@/lib/platforms/normalization";
import {
  matchDetectedGameToCanonical,
  uniqueCanonicalGameIds,
} from "@/lib/platforms/canonicalMatching";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

// Returns normalized detected games from Steam + PSN mock data, each resolved
// to a canonical gameId via GameExternalSource records. Unmatched detections
// are surfaced explicitly (they would enter a future matching review queue, not
// Discovery). This demonstrates the normalized ingestion flow without any real
// platform sync.
export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const detected = MOCK_PLATFORM_DETECTED_GAMES.filter(isIngestibleDetectedGame).map(
    (raw) => {
      const canonicalGameId = matchDetectedGameToCanonical(
        raw.platform,
        raw.externalId,
        MOCK_EXTERNAL_SOURCES
      );
      const normalized = normalizeDetectedGame(raw, canonicalGameId);
      const game = canonicalGameId
        ? MOCK_GAMES.find((g) => g.id === canonicalGameId)
        : null;
      return {
        ...normalized,
        canonicalTitle: game?.canonicalTitle ?? null,
      };
    }
  );

  const matched = detected.filter((d) => d.matched);
  const unmatched = detected.filter((d) => !d.matched);

  return apiOk({
    detected,
    matched,
    unmatched,
    summary: {
      total: detected.length,
      matched: matched.length,
      unmatched: unmatched.length,
      // Same title detected on Steam + PSN collapses to one canonical game.
      uniqueCanonicalGames: uniqueCanonicalGameIds(detected).length,
      bySource: {
        steam: detected.filter((d) => d.platform === "steam").length,
        psn: detected.filter((d) => d.platform === "psn").length,
      },
    },
  });
}
