import { SUPPORTED_PLATFORMS, PLATFORM_ACCOUNT_STATUS_LABELS, PLATFORM_SYNC_STATUS_LABELS } from "@/lib/platforms/platforms";
import { apiOk } from "@/lib/api/response";

// Public platform metadata: which providers Leet9 supports as game-data sources
// and what each can contribute. No auth required — this is static, non-user data,
// consistent with the existing public Discovery endpoints.
export async function GET() {
  const providers = SUPPORTED_PLATFORMS.map((p) => ({
    id: p.id,
    label: p.label,
    badgeLabel: p.badgeLabel,
    accentColor: p.accentColor,
    capabilities: p.capabilities,
    notes: p.notes,
  }));

  return apiOk({
    providers,
    connectionStatuses: PLATFORM_ACCOUNT_STATUS_LABELS,
    syncStatuses: PLATFORM_SYNC_STATUS_LABELS,
  });
}
