// Mock PSN Trophy Title API responses for dry-run testing.
//
// Shape mirrors the PSN Trophy API response:
//   GET https://m.np.playstation.com/api/trophy/v1/users/{accountId}/trophyTitles
//
// Fixtures demonstrate four cases the sync planner must handle:
//   1. Game that matches a known GameExternalSource (God of War Ragnarök)
//   2. Game already in UserGames AND matches (Elden Ring)
//   3. Game that matches but NOT yet in UserGames (Cyberpunk 2077)
//   4. Game with no matching GameExternalSource → unmatched, must not enter Discovery
//
// PSN does not reliably expose playtime — playtimeHours maps to null.
// Trophies (bronze/silver/gold/platinum) replace achievements.

export const PSN_RAW_TROPHY_TITLES = [
  {
    // Case 1: matched + not yet in profile
    npServiceName: "trophy2",
    npCommunicationId: "PPSA04863_00",
    trophySetVersion: "01.01",
    trophyTitleName: "God of War Ragnarök",
    trophyTitlePlatform: "PS5",
    hasTrophyGroups: false,
    definedTrophies: { bronze: 40, silver: 24, gold: 6, platinum: 1 },
    progress: 67,
    earnedTrophies: { bronze: 30, silver: 18, gold: 4, platinum: 0 },
    hiddenFlag: false,
    lastUpdatedDateTime: "2024-09-15T08:23:15Z",
  },
  {
    // Case 2: matched + already in UserGames (update path)
    npServiceName: "trophy",
    npCommunicationId: "CUSA28569_00",
    trophySetVersion: "01.02",
    trophyTitleName: "ELDEN RING",
    trophyTitlePlatform: "PS4",
    hasTrophyGroups: false,
    definedTrophies: { bronze: 42, silver: 9, gold: 2, platinum: 1 },
    progress: 88,
    earnedTrophies: { bronze: 42, silver: 9, gold: 1, platinum: 0 },
    hiddenFlag: false,
    lastUpdatedDateTime: "2025-03-10T14:50:00Z",
  },
  {
    // Case 3: matched + NOT in UserGames (create path)
    npServiceName: "trophy",
    npCommunicationId: "CUSA16596_00",
    trophySetVersion: "01.00",
    trophyTitleName: "Cyberpunk 2077",
    trophyTitlePlatform: "PS4",
    hasTrophyGroups: true,
    definedTrophies: { bronze: 37, silver: 13, gold: 7, platinum: 1 },
    progress: 42,
    earnedTrophies: { bronze: 16, silver: 5, gold: 2, platinum: 0 },
    hiddenFlag: false,
    lastUpdatedDateTime: "2025-01-08T21:17:00Z",
  },
  {
    // Case 4: no matching GameExternalSource → unmatched
    npServiceName: "trophy2",
    npCommunicationId: "PPSA99999_00",
    trophySetVersion: "01.00",
    trophyTitleName: "Unknown Exclusive Title",
    trophyTitlePlatform: "PS5",
    hasTrophyGroups: false,
    definedTrophies: { bronze: 20, silver: 8, gold: 3, platinum: 1 },
    progress: 15,
    earnedTrophies: { bronze: 4, silver: 1, gold: 0, platinum: 0 },
    hiddenFlag: false,
    lastUpdatedDateTime: "2025-02-01T10:00:00Z",
  },
  {
    // Case 5: Spider-Man 2 — matched + not in profile
    npServiceName: "trophy2",
    npCommunicationId: "PPSA08863_00",
    trophySetVersion: "01.00",
    trophyTitleName: "Marvel's Spider-Man 2",
    trophyTitlePlatform: "PS5",
    hasTrophyGroups: false,
    definedTrophies: { bronze: 35, silver: 16, gold: 8, platinum: 1 },
    progress: 100,
    earnedTrophies: { bronze: 35, silver: 16, gold: 8, platinum: 1 },
    hiddenFlag: false,
    lastUpdatedDateTime: "2024-11-20T18:30:00Z",
  },
  {
    // Case 6: The Last of Us Part I — matched + not in profile
    npServiceName: "trophy2",
    npCommunicationId: "PPSA01342_00",
    trophySetVersion: "01.00",
    trophyTitleName: "The Last of Us Part I",
    trophyTitlePlatform: "PS5",
    hasTrophyGroups: false,
    definedTrophies: { bronze: 20, silver: 18, gold: 10, platinum: 1 },
    progress: 55,
    earnedTrophies: { bronze: 12, silver: 10, gold: 5, platinum: 0 },
    hiddenFlag: false,
    lastUpdatedDateTime: "2024-07-04T09:00:00Z",
  },
];

export const PSN_RAW_API_RESPONSE = {
  trophyTitles: PSN_RAW_TROPHY_TITLES,
  totalItemCount: PSN_RAW_TROPHY_TITLES.length,
};
