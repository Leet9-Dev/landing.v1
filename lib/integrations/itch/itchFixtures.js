// Realistic mock itch.io owned-game responses for dry-run testing.
//
// Shape approximates the itch.io API /my-games response.
// Fixtures cover:
//   1. Hollow Knight → matches game_hollow_knight (sold on itch.io by Team Cherry)
//   2. Stardew Valley → matches game_stardew_valley
//   3. Unmatched indie titles (the typical itch.io catalogue)

export const ITCH_RAW_OWNED_GAMES = [
  {
    id: "hollow-knight",
    title: "Hollow Knight",
    classification: "game",
    purchasedAt: "2019-03-10T00:00:00Z",
  },
  {
    id: "stardew-valley",
    title: "Stardew Valley",
    classification: "game",
    purchasedAt: "2020-07-22T00:00:00Z",
  },
  {
    // Unmatched — indie title not in canonical catalogue
    id: "celeste",
    title: "Celeste",
    classification: "game",
    purchasedAt: "2021-01-15T00:00:00Z",
  },
  {
    // Unmatched — indie title not in canonical catalogue
    id: "undertale",
    title: "Undertale",
    classification: "game",
    purchasedAt: "2020-11-01T00:00:00Z",
  },
];

export const ITCH_RAW_API_RESPONSE = {
  games: ITCH_RAW_OWNED_GAMES,
};
