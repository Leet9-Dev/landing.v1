// Authenticated Steam account validation (Phase 17).
//
// Validates the current user's connected Steam PlatformAccount against the real
// Steam Web API (GetPlayerSummaries) and stores a small, safe set of public
// profile fields on the account's metadata. Does NOT fetch the library or create
// PlatformDetectedGame records.

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { toSafeAccountDto } from "@/lib/platforms/accountIdentity";
import {
  fetchSteamPlayerSummary,
  steamVisibilityLabel,
  isSteamConfigured,
  SteamConfigError,
  SteamApiError,
} from "@/lib/integrations/steam/steamApiClient";

const DB_META = { source: "database", provider: "steam" };

export async function POST() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;
  const userId = session.user.id;

  const account = await prisma.platformAccount.findUnique({
    where: { userId_provider: { userId, provider: "steam" } },
  });
  if (!account) {
    return apiError("PLATFORM_ACCOUNT_NOT_FOUND", "No connected Steam account to validate.", 404);
  }

  const steamId64 = account.externalUserId;
  if (!steamId64 || !/^\d{17}$/.test(steamId64)) {
    return apiError("VALIDATION_ERROR", "Stored Steam ID is not a valid steamID64.", 400);
  }

  if (!isSteamConfigured()) {
    return apiError("STEAM_NOT_CONFIGURED", "Steam validation is not configured on the server yet.", 503);
  }

  let summary;
  try {
    summary = await fetchSteamPlayerSummary(steamId64);
  } catch (err) {
    if (err instanceof SteamConfigError) {
      return apiError("STEAM_NOT_CONFIGURED", "Steam validation is not configured on the server yet.", 503);
    }
    if (err instanceof SteamApiError) {
      return apiError("STEAM_API_ERROR", "Could not reach Steam to validate this account. Please try again later.", 502);
    }
    return apiError("INTERNAL_ERROR", "Unexpected error validating the Steam account.", 500);
  }

  if (!summary) {
    return apiError("STEAM_PROFILE_NOT_FOUND", "No public Steam profile was found for this Steam ID.", 404);
  }

  const visibility = steamVisibilityLabel(summary);
  const personaName = typeof summary.personaname === "string" ? summary.personaname : null;
  const avatarUrl = typeof summary.avatarfull === "string" ? summary.avatarfull : null;

  // Merge only safe, public fields into metadata. No raw payload, no secrets.
  const existingMetadata = (account.metadata && typeof account.metadata === "object") ? account.metadata : {};
  const nextMetadata = {
    ...existingMetadata,
    steamProfile: { personaName, avatarUrl, visibility },
    lastValidatedAt: new Date().toISOString(),
  };

  const updated = await prisma.platformAccount.update({
    where: { userId_provider: { userId, provider: "steam" } },
    data: {
      displayName: account.displayName || personaName || account.displayName,
      metadata: nextMetadata,
    },
  });

  return apiOk(
    {
      account: toSafeAccountDto(updated),
      validation: { valid: true, personaName, avatarUrl, visibility },
      message:
        visibility === "public"
          ? "Steam account validated."
          : "Steam account validated, but the profile/library is private — library sync will be limited.",
    },
    DB_META,
  );
}
