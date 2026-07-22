// Authenticated PlatformAccount read/write path (Phase 16).
//
// All operations are authenticated; userId is derived from the session and
// never accepted from the client.
//
// Connect validates the identifier format. When STEAM_API_KEY is set, Steam
// steamid64 is also validated against GetPlayerSummaries (real account check +
// persona name fetch). For PSN, if an `npsso` field is provided in the body,
// it is validated by exchanging for a PSN access token, the Online ID is
// fetched from the PSN profile, and the NPSSO is stored AES-256-GCM encrypted
// in metadata (requires PSN_CREDENTIAL_KEY). Without an NPSSO, the Online ID
// is accepted directly (legacy/preview mode).
// Disconnect soft-disconnects (status → disconnected, row preserved).

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { SUPPORTED_PLATFORMS, getPlatform, PLATFORM_ACCOUNT_STATUS, PLATFORM_SYNC_STATUS } from "@/lib/platforms/platforms";
import { validateConnectInput, validateProvider, toSafeAccountDto } from "@/lib/platforms/accountIdentity";
import { hasSteamApiKey, fetchSteamPlayerSummaries } from "@/lib/integrations/steam/steamClient";
import { exchangeNpssoForAuth } from "@/lib/integrations/psn/psnClient";
import { encryptNpsso, hasCredentialKey } from "@/lib/integrations/psn/credentialStore";
import { getProfileFromAccountId } from "psn-api";

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

// POST — connect or reconnect a platform account.
// Upserts by (userId, provider); marks CONNECTED.
// For PSN with an npsso field: validates the token, fetches the PSN Online ID,
// and stores the NPSSO encrypted in metadata. For all other cases, the public
// identifier is accepted directly.
export async function POST(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;
  const userId = session.user.id;

  const body = await parseJson(request);
  if (!body) return apiError("VALIDATION_ERROR", "Invalid or missing JSON body.", 400);

  // PSN NPSSO flow: user provides their NPSSO token instead of an Online ID.
  // We exchange it, fetch their PSN profile, and derive the Online ID from it.
  const rawNpsso = typeof body.npsso === "string" ? body.npsso.trim() : null;
  if (body.provider === "psn" && rawNpsso) {
    if (!hasCredentialKey()) {
      return apiError(
        "PSN_CREDENTIAL_KEY_MISSING",
        "PSN live sync is not configured on this server. Contact support.",
        503
      );
    }
    if (rawNpsso.length < 16 || rawNpsso.length > 512) {
      return apiError("VALIDATION_ERROR", "Invalid NPSSO token format.", 400);
    }

    let auth;
    try {
      auth = await exchangeNpssoForAuth(rawNpsso);
    } catch {
      return apiError("PSN_AUTH_FAILED", "Could not validate NPSSO token. Make sure it is current and try again.", 401);
    }

    // Fetch the PSN profile for the authenticated account to get the Online ID.
    let onlineId = null;
    try {
      const res = await getProfileFromAccountId({ accessToken: auth.accessToken }, "me");
      onlineId = res?.onlineId ?? null;
    } catch {
      // Non-fatal — handled below.
    }
    if (!onlineId) {
      return apiError("PSN_PROFILE_NOT_FOUND", "Could not fetch your PSN profile. Try again shortly.", 502);
    }

    const platform = getPlatform("psn");
    const encryptedNpsso = encryptNpsso(rawNpsso);

    const connectedFields = {
      externalUserId: onlineId,
      username: onlineId,
      displayName: onlineId,
      status: PLATFORM_ACCOUNT_STATUS.CONNECTED,
      syncStatus: PLATFORM_SYNC_STATUS.IDLE,
      connectedAt: new Date(),
      disconnectedAt: null,
      needsReauthAt: null,
      capabilities: platform?.capabilities ?? undefined,
      metadata: {
        connectedVia: "npsso",
        npsso: encryptedNpsso,
      },
    };

    const row = await prisma.platformAccount.upsert({
      where: { userId_provider: { userId, provider: "psn" } },
      create: { userId, provider: "psn", ...connectedFields },
      update: connectedFields,
    });

    return apiOk(
      {
        account: toSafeAccountDto(row),
        message: `PSN account ${onlineId} connected with live sync enabled.`,
      },
      DB_META,
    );
  }

  // Default flow: public identifier (Steam steamid64 or PSN Online ID).
  const parsed = validateConnectInput(body);
  if (!parsed.ok) return apiError("VALIDATION_ERROR", parsed.error, 400);

  let { provider, externalUserId, username, displayName } = parsed.value;
  const platform = getPlatform(provider);

  // When STEAM_API_KEY is present, validate the steamid64 against the real
  // Steam API and pull the persona name so we store an accurate display name.
  if (provider === "steam" && hasSteamApiKey()) {
    let player;
    try {
      player = await fetchSteamPlayerSummaries(externalUserId);
    } catch (e) {
      return apiError("STEAM_API_ERROR", "Could not reach Steam API. Try again shortly.", 502);
    }
    if (!player) {
      return apiError("STEAM_ACCOUNT_NOT_FOUND", "No Steam account found for that steamID64. Double-check the ID.", 404);
    }
    username = player.personaname ?? null;
    displayName = player.personaname ?? displayName;
  }

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
