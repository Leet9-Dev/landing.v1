// Authenticated PlatformAccount read/write path (Phase 16).
//
// First REAL database persistence path for connected gaming platforms. All
// operations are authenticated and app-only; the userId is derived from the
// session and NEVER accepted from the client.
//
// Scope boundaries (Phase 16):
// - Connect = create a PlatformAccount *record* from a safe public identifier
//   (Steam steamid64 / PSN onlineId). NO Steam/PSN API calls, NO library sync,
//   NO achievements/trophies, NO STEAM_API_KEY, NO NPSSO/token storage.
// - Disconnect = soft-disconnect (status → disconnected, keep the row + history).
// - Raw platform data does not power Discovery/Profile/Stats/Rankings yet.

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { SUPPORTED_PLATFORMS, getPlatform, PLATFORM_ACCOUNT_STATUS, PLATFORM_SYNC_STATUS } from "@/lib/platforms/platforms";
import { validateConnectInput, validateProvider, toSafeAccountDto } from "@/lib/platforms/accountIdentity";

const DB_META = { source: "database" };

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// GET — current user's platform accounts, joined onto the supported providers.
// Returns safe DTOs only (no credentials/metadata). 401 when unauthenticated.
export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;
  const userId = session.user.id;

  const rows = await prisma.platformAccount.findMany({
    where: { userId },
    orderBy: { provider: "asc" },
  });

  const byProvider = new Map(rows.map((r) => [r.provider, r]));

  const providers = SUPPORTED_PLATFORMS.map((p) => ({
    id: p.id,
    label: p.label,
    badgeLabel: p.badgeLabel,
    accentColor: p.accentColor,
    capabilities: p.capabilities,
    notes: p.notes,
    account: toSafeAccountDto(byProvider.get(p.id) ?? null),
  }));

  const connectedCount = rows.filter((r) => r.status === PLATFORM_ACCOUNT_STATUS.CONNECTED).length;

  return apiOk({ providers, connectedCount }, DB_META);
}

// POST — connect or reconnect a platform account from a safe public identifier.
// Upserts by (userId, provider); marks CONNECTED. No platform API is called.
export async function POST(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;
  const userId = session.user.id;

  const body = await parseJson(request);
  if (!body) return apiError("VALIDATION_ERROR", "Invalid or missing JSON body.", 400);

  const parsed = validateConnectInput(body);
  if (!parsed.ok) return apiError("VALIDATION_ERROR", parsed.error, 400);

  const { provider, externalUserId, username, displayName } = parsed.value;
  const platform = getPlatform(provider);

  // Fields set on both create and reconnect. Credentials are never stored;
  // metadata records only how the record was created (no secrets).
  const connectedFields = {
    externalUserId,
    username,
    displayName,
    status: PLATFORM_ACCOUNT_STATUS.CONNECTED,
    syncStatus: PLATFORM_SYNC_STATUS.IDLE,
    connectedAt: new Date(),
    disconnectedAt: null,
    needsReauthAt: null,
    capabilities: platform?.capabilities ?? undefined,
    metadata: {
      connectedVia: "manual_identity",
      note: "Identity record only. No platform API auth or library sync performed.",
    },
  };

  const row = await prisma.platformAccount.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, ...connectedFields },
    update: connectedFields,
  });

  return apiOk(
    {
      account: toSafeAccountDto(row),
      message: `${platform?.label ?? provider} account record created. Game library sync is not active yet.`,
    },
    DB_META,
  );
}

// DELETE — soft-disconnect. Sets status → disconnected and stamps disconnectedAt,
// but PRESERVES the row (and any related sync/detected-game/user-game data) for
// audit and reconnect history. Provider comes from the JSON body or ?provider=.
export async function DELETE(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;
  const userId = session.user.id;

  const body = await parseJson(request);
  const providerInput = body?.provider ?? new URL(request.url).searchParams.get("provider");
  const parsed = validateProvider(providerInput);
  if (!parsed.ok) return apiError("VALIDATION_ERROR", parsed.error, 400);
  const provider = parsed.value;

  const existing = await prisma.platformAccount.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!existing) {
    return apiError("PLATFORM_ACCOUNT_NOT_FOUND", "No connected account for this provider.", 404);
  }

  const row = await prisma.platformAccount.update({
    where: { userId_provider: { userId, provider } },
    data: {
      status: PLATFORM_ACCOUNT_STATUS.DISCONNECTED,
      disconnectedAt: new Date(),
    },
  });

  return apiOk(
    { account: toSafeAccountDto(row), message: "Account disconnected. Your record is kept for reconnect and audit." },
    DB_META,
  );
}
