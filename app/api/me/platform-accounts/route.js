import { MOCK_PLATFORM_ACCOUNTS } from "@/lib/mock/platformAccounts";
import { getPlatform, PLATFORM_ACCOUNT_STATUS_LABELS } from "@/lib/platforms/platforms";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

// Current user's platform account states, enriched with normalized status
// labels and the platform's declared capabilities. Steam + PSN are returned
// as first-class game-data sources.
export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const accounts = MOCK_PLATFORM_ACCOUNTS.map((a) => {
    const platform = getPlatform(a.provider);
    return {
      ...a,
      statusLabel: PLATFORM_ACCOUNT_STATUS_LABELS[a.status] ?? a.status,
      capabilities: platform?.capabilities ?? null,
      label: platform?.label ?? a.provider,
    };
  });

  const gameDataSources = accounts.filter((a) => a.isGameDataSource);

  return apiOk({
    accounts,
    gameDataSources,
    connectedCount: gameDataSources.filter((a) => a.status === "connected").length,
  });
}
