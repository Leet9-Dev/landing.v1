// Realistic mock GOG owned-game responses for dry-run testing.
//
// Shape approximates the GOG public profile API response.
// Fixtures cover:
//   1. The Witcher 3 → matches game_witcher3 (GOG original)
//   2. Cyberpunk 2077 → matches game_cyberpunk_2077 (CD PROJEKT RED)
//   3. Hollow Knight → matches game_hollow_knight
//   4. An unmatched GOG exclusive (no canonical entry yet)

export const GOG_RAW_OWNED_GAMES = [
  {
    id: "1207664643",
    title: "The Witcher 3: Wild Hunt",
    achievementsCount: 52,
    achievementsUnlocked: 38,
    hoursPlayed: null, // GOG public API does not expose playtime
  },
  {
    id: "1423049311",
    title: "Cyberpunk 2077",
    achievementsCount: 44,
    achievementsUnlocked: 12,
    hoursPlayed: null,
  },
  {
    id: "1308320804",
    title: "Hollow Knight",
    achievementsCount: 63,
    achievementsUnlocked: 47,
    hoursPlayed: null,
  },
  {
    // Unmatched — not in canonical catalogue
    id: "1949616134",
    title: "Disco Elysium - The Final Cut",
    achievementsCount: 0,
    achievementsUnlocked: 0,
    hoursPlayed: null,
  },
];

export const GOG_RAW_API_RESPONSE = {
  games: GOG_RAW_OWNED_GAMES,
  totalCount: GOG_RAW_OWNED_GAMES.length,
};
