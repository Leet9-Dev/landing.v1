// Realistic mock Epic Games Store account response for dry-run testing.
//
// Shape approximates the Epic Games public profile API response.
// Fixtures cover:
//   1. Fortnite → matches game_fortnite via "fortnite"
//   2. Rocket League → matches game_rocket_league via "rocketleague"
//   3. An unmatched Epic exclusive

export const EPIC_RAW_GAMES = [
  {
    catalogItemId: "fortnite",
    title: "Fortnite",
    minutesPlayed: null, // Epic API does not expose playtime publicly
    lastPlayedAt: "2025-07-22T17:00:00Z",
  },
  {
    catalogItemId: "rocketleague",
    title: "Rocket League",
    minutesPlayed: null,
    lastPlayedAt: "2025-07-18T21:00:00Z",
  },
  {
    // Unmatched — not in canonical catalogue
    catalogItemId: "sifu",
    title: "Sifu",
    minutesPlayed: null,
    lastPlayedAt: "2025-05-10T14:00:00Z",
  },
];

export const EPIC_RAW_API_RESPONSE = {
  accountId: "fixture-epic-account-id",
  displayName: "ShadowViper99",
  games: EPIC_RAW_GAMES,
};
