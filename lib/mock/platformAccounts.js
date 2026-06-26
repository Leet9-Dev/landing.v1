// Status values use the normalized vocabulary from lib/platforms/platforms.js:
// connected | disconnected | needs_reauth | unavailable.
// `isGameDataSource` marks platforms that contribute games to the canonical
// catalogue (Steam + PSN). Google is login-only.
export const MOCK_PLATFORM_ACCOUNTS = [
  {
    id: "pa_google_mockuser",
    provider: "google",
    username: null,
    displayName: "Alex Romano",
    status: "connected",
    connectedAt: "2024-09-01T00:00:00Z",
    lastSyncAt: null,
    syncStatus: "idle",
    confidence: "High",
    summary: "Login provider",
    isGameDataSource: false,
    detectedGamesCount: 0,
  },
  {
    id: "pa_steam_mockuser",
    provider: "steam",
    username: "ShadowViper99",
    displayName: "ShadowViper99",
    status: "connected",
    connectedAt: "2024-09-10T00:00:00Z",
    lastSyncAt: "2025-06-24T20:00:00Z",
    syncStatus: "success",
    confidence: "High",
    summary: "4 games · 1485h · 79 achievements",
    isGameDataSource: true,
    detectedGamesCount: 4,
  },
  {
    id: "pa_psn_mockuser",
    provider: "psn",
    username: null,
    displayName: null,
    status: "disconnected",
    connectedAt: null,
    lastSyncAt: null,
    syncStatus: "idle",
    confidence: "Incomplete",
    summary: "Not connected — 3 games detectable once linked",
    isGameDataSource: true,
    detectedGamesCount: 3,
  },
];
