// Platform-agnostic source definitions for Leet9.
//
// Leet9 treats Steam and PSN as first-class GAME-DATA sources. Google is a
// login provider only and is intentionally NOT a game-data platform here.
//
// Capabilities marked "to be validated" reflect assumptions used by the mock
// layer; they must be confirmed against real platform APIs before production.
// See docs/PLATFORM_INTEGRATION_READINESS.md.

// Normalized platform account statuses used across Leet9.
// connection status: describes whether the platform account is connected.
export const PLATFORM_ACCOUNT_STATUS = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  NEEDS_REAUTH: "needs_reauth",
  UNAVAILABLE: "unavailable",
};

export const PLATFORM_ACCOUNT_STATUS_LABELS = {
  connected: "Connected",
  disconnected: "Not connected",
  needs_reauth: "Needs re-auth",
  unavailable: "Unavailable",
};

// Normalized platform sync statuses used across Leet9.
// sync status: describes the outcome of the latest data sync attempt.
export const PLATFORM_SYNC_STATUS = {
  IDLE: "idle",
  SYNCING: "syncing",
  SUCCESS: "success",
  FAILED: "failed",
  PARTIAL: "partial",
};

export const PLATFORM_SYNC_STATUS_LABELS = {
  idle: "Never synced",
  syncing: "Syncing…",
  success: "Synced",
  failed: "Sync failed",
  partial: "Partially synced",
};

// Supported game-data platform providers. `gameLibrary` is true for all
// because each can contribute games to the canonical Discovery catalogue.
export const PLATFORM_PROVIDERS = {
  steam: {
    id: "steam",
    label: "Steam",
    badgeLabel: "STEAM",
    accentColor: "#b9d8f5",
    capabilities: {
      authLogin: true,
      gameLibrary: true,
      achievements: true,
      trophies: false,
      playtime: true,
    },
    notes: "Steam can support both login and library/game data.",
  },
  psn: {
    id: "psn",
    label: "PSN",
    badgeLabel: "PSN",
    accentColor: "#c8aaff",
    capabilities: {
      authLogin: false,
      gameLibrary: true,
      achievements: false,
      trophies: true,
      playtime: true,
    },
    notes:
      "PSN must be supported as a game-data source. The safest real integration path is to be validated before production.",
  },
  xbox: {
    id: "xbox",
    label: "Xbox",
    badgeLabel: "XBOX",
    accentColor: "#52D017",
    capabilities: {
      authLogin: false,
      gameLibrary: true,
      achievements: true,
      trophies: false,
      playtime: false, // to be validated against real Xbox API
    },
    notes: "Xbox Live integration — public Gamertag identifier. Real sync requires Microsoft OAuth.",
  },
  riot: {
    id: "riot",
    label: "Riot Games",
    badgeLabel: "RIOT",
    accentColor: "#FF4655",
    capabilities: {
      authLogin: false,
      gameLibrary: true,
      achievements: false,
      trophies: false,
      playtime: false,
    },
    notes: "Riot ID links League of Legends, Valorant and other Riot titles. Requires Riot API key.",
  },
  battlenet: {
    id: "battlenet",
    label: "Battle.net",
    badgeLabel: "BNET",
    accentColor: "#00AEEF",
    capabilities: {
      authLogin: false,
      gameLibrary: true,
      achievements: false,
      trophies: false,
      playtime: false,
    },
    notes: "Battle.net BattleTag links Diablo IV, Overwatch 2 and other Blizzard titles.",
  },
  epic: {
    id: "epic",
    label: "Epic Games",
    badgeLabel: "EPIC",
    accentColor: "#F5A623",
    capabilities: {
      authLogin: false,
      gameLibrary: true,
      achievements: false,
      trophies: false,
      playtime: false,
    },
    notes: "Epic Games Store library sync — Fortnite, Rocket League and Epic exclusives.",
  },
};

// Ordered list of supported game-data providers (DB-backed).
export const SUPPORTED_PLATFORMS = Object.values(PLATFORM_PROVIDERS);

// Display-only platform entries for Platform Hub — not yet DB-backed.
export const COMING_SOON_PLATFORMS = [
  {
    id: "gog",
    label: "GOG",
    badgeLabel: "GOG",
    accentColor: "#C479E2",
    description: "GOG Galaxy — DRM-free game library.",
  },
  {
    id: "itch",
    label: "itch.io",
    badgeLabel: "ITCH",
    accentColor: "#FA5C5C",
    description: "Indie game library from itch.io.",
  },
];

export function getPlatform(providerId) {
  return PLATFORM_PROVIDERS[providerId] || null;
}

export function isSupportedPlatform(providerId) {
  return Boolean(PLATFORM_PROVIDERS[providerId]);
}

export function platformLabel(providerId) {
  return PLATFORM_PROVIDERS[providerId]?.label || providerId;
}
