// Raw detected platform games — the shape an external platform API might return
// BEFORE normalization. These are intentionally "raw": platform externalIds and
// platform-reported titles, not canonical Leet9 games. The ingestion flow
// resolves each to a canonical gameId via GameExternalSource records
// (lib/mock/gameExternalSources.js) using lib/platforms/canonicalMatching.js.
//
// Coverage demonstrated (per Phase 7 requirements):
//   - Steam-only canonical game:      Hollow Knight (steam 367520)
//   - PSN-only canonical games:       God of War Ragnarök, Spider-Man 2
//   - Same game from Steam AND PSN:   ELDEN RING (steam 1245620 + psn CUSA28569_00)
//   - Unmatched detected game:        a Steam appId with no canonical mapping yet

export const MOCK_STEAM_DETECTED_GAMES = [
  {
    platform: "steam",
    externalId: "1245620",
    externalTitle: "ELDEN RING",
    playtimeMinutes: 17070,
    achievementsUnlocked: 28,
    lastPlayedAt: "2025-06-15T20:00:00Z",
  },
  {
    platform: "steam",
    externalId: "252950",
    externalTitle: "Rocket League",
    playtimeMinutes: 77040,
    achievementsUnlocked: 45,
    lastPlayedAt: "2025-06-22T14:30:00Z",
  },
  {
    platform: "steam",
    externalId: "1091500",
    externalTitle: "Cyberpunk 2077",
    playtimeMinutes: 8520,
    achievementsUnlocked: 19,
    lastPlayedAt: "2025-06-24T09:00:00Z",
  },
  {
    platform: "steam",
    externalId: "367520",
    externalTitle: "Hollow Knight",
    playtimeMinutes: 3504,
    achievementsUnlocked: 12,
    lastPlayedAt: "2025-06-10T19:00:00Z",
  },
  {
    // Intentionally unmatched: no GameExternalSource maps this appId yet.
    // Should NOT enter Discovery; belongs in a future matching review queue.
    platform: "steam",
    externalId: "2515020",
    externalTitle: "Unmatched Indie Prototype",
    playtimeMinutes: 240,
    achievementsUnlocked: 2,
    lastPlayedAt: "2025-05-30T12:00:00Z",
  },
];

export const MOCK_PSN_DETECTED_GAMES = [
  {
    // Same canonical game as the Steam ELDEN RING above -> must collapse to one.
    platform: "psn",
    externalId: "CUSA28569_00",
    externalTitle: "ELDEN RING",
    playtimeMinutes: 6200,
    trophiesUnlocked: 21,
    lastPlayedAt: "2025-06-12T18:00:00Z",
  },
  {
    platform: "psn",
    externalId: "PPSA04863_00",
    externalTitle: "God of War Ragnarök",
    playtimeMinutes: 4980,
    trophiesUnlocked: 34,
    lastPlayedAt: "2025-06-09T21:00:00Z",
  },
  {
    platform: "psn",
    externalId: "PPSA08863_00",
    externalTitle: "Marvel's Spider-Man 2",
    playtimeMinutes: 2760,
    trophiesUnlocked: 28,
    lastPlayedAt: "2025-06-08T20:30:00Z",
  },
];

export const MOCK_PLATFORM_DETECTED_GAMES = [
  ...MOCK_STEAM_DETECTED_GAMES,
  ...MOCK_PSN_DETECTED_GAMES,
];
