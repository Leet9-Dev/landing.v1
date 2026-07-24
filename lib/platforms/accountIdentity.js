// PlatformAccount identity validation + safe serialization (Phase 16).
//
// PURE, no DB, no network. These helpers validate the *safe* identity input a
// user provides when connecting a platform account (a public identifier only —
// NEVER a credential/token), and shape a DB row into a response DTO that omits
// all sensitive fields.
//
// Security notes:
// - Steam identity = steamid64 (a public 17-digit id). No API key, no library.
// - PSN identity   = onlineId (a public username). NPSSO/tokens are NOT accepted
//   or stored — real PSN auth is gated on a secure encrypted-credential design
//   that does not exist in this schema yet.

import { isSupportedPlatform, PLATFORM_ACCOUNT_STATUS_LABELS, PLATFORM_SYNC_STATUS_LABELS } from "@/lib/platforms/platforms";

// Fields that are NEVER returned to the client. `metadata` is excluded wholesale
// as defense-in-depth even though credentials are never written into it.
const SAFE_ACCOUNT_FIELDS = [
  "id",
  "provider",
  "externalUserId",
  "username",
  "displayName",
  "status",
  "syncStatus",
  "connectedAt",
  "disconnectedAt",
  "lastSyncAt",
  "needsReauthAt",
  "createdAt",
  "updatedAt",
];

/**
 * Validate and normalize a connect request's safe identity input.
 * Returns { ok, error?, value? } where value = { provider, externalUserId,
 * username, displayName }. No credentials are ever accepted.
 */
export function validateConnectInput(body) {
  const provider = typeof body?.provider === "string" ? body.provider.trim().toLowerCase() : "";
  if (!isSupportedPlatform(provider)) {
    return { ok: false, error: "Unsupported platform. Supported: steam, psn, xbox, riot, battlenet, epic, gog, itch, ea." };
  }

  const rawIdentifier =
    typeof body?.identifier === "string"
      ? body.identifier.trim()
      : typeof body?.externalUserId === "string"
        ? body.externalUserId.trim()
        : "";

  if (!rawIdentifier) {
    return { ok: false, error: "Missing account identifier." };
  }

  const displayName =
    typeof body?.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 80)
      : null;

  if (provider === "steam") {
    // steamid64: 17-digit number (public identifier).
    if (!/^\d{17}$/.test(rawIdentifier)) {
      return { ok: false, error: "Invalid Steam ID. Provide a 17-digit steamID64." };
    }
    return {
      ok: true,
      value: { provider, externalUserId: rawIdentifier, username: null, displayName },
    };
  }

  if (provider === "psn") {
    // PSN onlineId: 3–16 chars, starts with a letter, then letters/digits/-/_.
    if (!/^[A-Za-z][A-Za-z0-9_-]{2,15}$/.test(rawIdentifier)) {
      return { ok: false, error: "Invalid PSN online ID (3–16 chars, starts with a letter)." };
    }
    return {
      ok: true,
      value: { provider, externalUserId: rawIdentifier, username: rawIdentifier, displayName: displayName ?? rawIdentifier },
    };
  }

  if (provider === "xbox") {
    // Xbox Gamertag: 1–12 chars, starts with a letter or digit, rest letters/digits/spaces.
    if (!/^[A-Za-z0-9][A-Za-z0-9 ]{0,11}$/.test(rawIdentifier)) {
      return { ok: false, error: "Invalid Xbox Gamertag (1–12 chars, letters, digits, or spaces)." };
    }
    return {
      ok: true,
      value: { provider, externalUserId: rawIdentifier, username: rawIdentifier, displayName: displayName ?? rawIdentifier },
    };
  }

  if (provider === "riot") {
    // Riot ID: GameName#TagLine — Name 3–16 chars, TagLine 2–5 alphanumeric.
    if (!/^[A-Za-z0-9 ._-]{3,16}#[A-Za-z0-9]{2,5}$/.test(rawIdentifier)) {
      return { ok: false, error: "Invalid Riot ID. Format: GameName#TAG (e.g. Player#EUW)." };
    }
    return {
      ok: true,
      value: { provider, externalUserId: rawIdentifier, username: rawIdentifier, displayName: displayName ?? rawIdentifier },
    };
  }

  if (provider === "battlenet") {
    // BattleTag: Name#XXXX — Name 2–12 chars, suffix 4–5 digits.
    if (!/^[A-Za-z][A-Za-z0-9]{1,11}#\d{4,5}$/.test(rawIdentifier)) {
      return { ok: false, error: "Invalid BattleTag. Format: Name#1234 (e.g. Player#1234)." };
    }
    return {
      ok: true,
      value: { provider, externalUserId: rawIdentifier, username: rawIdentifier, displayName: displayName ?? rawIdentifier },
    };
  }

  if (provider === "epic") {
    // Epic username: 3–16 chars, letters/digits/hyphens/underscores.
    if (!/^[A-Za-z0-9_-]{3,16}$/.test(rawIdentifier)) {
      return { ok: false, error: "Invalid Epic username (3–16 chars, letters, digits, - or _)." };
    }
    return {
      ok: true,
      value: { provider, externalUserId: rawIdentifier, username: rawIdentifier, displayName: displayName ?? rawIdentifier },
    };
  }

  if (provider === "gog") {
    // GOG username: 2–30 chars, letters/digits/underscores/hyphens.
    if (!/^[A-Za-z0-9_-]{2,30}$/.test(rawIdentifier)) {
      return { ok: false, error: "Invalid GOG username (2–30 chars, letters, digits, _ or -)." };
    }
    return {
      ok: true,
      value: { provider, externalUserId: rawIdentifier, username: rawIdentifier, displayName: displayName ?? rawIdentifier },
    };
  }

  if (provider === "itch") {
    // itch.io username: 2–30 chars, letters/digits/hyphens.
    if (!/^[A-Za-z0-9-]{2,30}$/.test(rawIdentifier)) {
      return { ok: false, error: "Invalid itch.io username (2–30 chars, letters, digits or hyphens)." };
    }
    return {
      ok: true,
      value: { provider, externalUserId: rawIdentifier, username: rawIdentifier, displayName: displayName ?? rawIdentifier },
    };
  }

  if (provider === "ea") {
    // EA username (EA ID / Origin ID): 3–30 chars, letters/digits/underscores/hyphens.
    if (!/^[A-Za-z0-9_-]{3,30}$/.test(rawIdentifier)) {
      return { ok: false, error: "Invalid EA username (3–30 chars, letters, digits, _ or -)." };
    }
    return {
      ok: true,
      value: { provider, externalUserId: rawIdentifier, username: rawIdentifier, displayName: displayName ?? rawIdentifier },
    };
  }

  return { ok: false, error: "Unsupported platform." };
}

/** Extract and validate the provider from a disconnect request. */
export function validateProvider(value) {
  const provider = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!isSupportedPlatform(provider)) {
    return { ok: false, error: "Unsupported platform. Supported: steam, psn, xbox, riot, battlenet, epic, gog, itch, ea." };
  }
  return { ok: true, value: provider };
}

/**
 * Shape a PlatformAccount DB row into a safe response DTO. Omits `metadata` and
 * any field not on the whitelist; adds human-readable status labels.
 */
export function toSafeAccountDto(row) {
  if (!row) return null;
  const dto = {};
  for (const key of SAFE_ACCOUNT_FIELDS) {
    if (row[key] !== undefined) dto[key] = row[key];
  }
  dto.statusLabel = PLATFORM_ACCOUNT_STATUS_LABELS[row.status] ?? row.status;
  dto.syncStatusLabel = PLATFORM_SYNC_STATUS_LABELS[row.syncStatus] ?? row.syncStatus;
  return dto;
}
