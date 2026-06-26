// Platform-agnostic source definitions for Leet9.
//
// Leet9 treats Steam and PSN as first-class GAME-DATA sources. Google is a
// login provider only and is intentionally NOT a game-data platform here.
//
// Capabilities marked "to be validated" reflect assumptions used by the mock
// layer; they must be confirmed against real platform APIs before production.
// See docs/PLATFORM_INTEGRATION_READINESS.md.

// Normalized platform account statuses used across Leet9.
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

// Supported game-data platform providers. `gameLibrary` is true for both
// because both can contribute games to the canonical Discovery catalogue.
export const PLATFORM_PROVIDERS = {
  steam: {
    id: "steam",
    label: "Steam",
    badgeLabel: "STEAM",
    accentColor: "#b9d8f5",
    capabilities: {
      authLogin: true, // Steam can support both login and game data
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
      authLogin: false, // PSN is a game-data source, not a Leet9 login provider
      gameLibrary: true,
      achievements: false,
      trophies: true,
      playtime: true, // to be validated against real PSN data access
    },
    notes:
      "PSN must be supported as a game-data source. The safest real integration path is to be validated before production.",
  },
};

// Ordered list of supported game-data providers.
export const SUPPORTED_PLATFORMS = Object.values(PLATFORM_PROVIDERS);

export function getPlatform(providerId) {
  return PLATFORM_PROVIDERS[providerId] || null;
}

export function isSupportedPlatform(providerId) {
  return Boolean(PLATFORM_PROVIDERS[providerId]);
}

export function platformLabel(providerId) {
  return PLATFORM_PROVIDERS[providerId]?.label || providerId;
}
