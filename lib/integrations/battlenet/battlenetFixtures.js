// Realistic mock Battle.net account response for dry-run testing.
//
// Shape approximates the Blizzard OAuth / game data API response.
// Fixtures cover:
//   1. Diablo IV → matches game_diablo_iv via Battle.net externalId "diablo4"
//   2. Overwatch 2 → matches game_overwatch2 via "overwatch2"
//   3. World of Warcraft → unmatched (not in canonical catalogue)

export const BATTLENET_RAW_GAMES = [
  {
    productId: "diablo4",
    name: "Diablo IV",
    hoursPlayed: null, // Blizzard API does not expose playtime globally
    lastPlayedAt: "2025-07-15T23:00:00Z",
  },
  {
    productId: "overwatch2",
    name: "Overwatch 2",
    hoursPlayed: null,
    lastPlayedAt: "2025-07-20T18:00:00Z",
  },
  {
    // Unmatched — World of Warcraft is not in the canonical catalogue yet
    productId: "wow",
    name: "World of Warcraft",
    hoursPlayed: null,
    lastPlayedAt: "2025-06-30T03:00:00Z",
  },
];

export const BATTLENET_RAW_API_RESPONSE = {
  battletag: "Player#1234",
  games: BATTLENET_RAW_GAMES,
};
