// Realistic mock Xbox owned-game responses for dry-run testing.
//
// Shape approximates the Xbox TitleHub / Activity Feed API response.
// Fixture games cover:
//   1. Games that match known GameExternalSources (Sea of Thieves, Minecraft, Elden Ring)
//   2. A game already expected in UserGames (GTA V)
//   3. A game with no matching external source → unmatched

export const XBOX_RAW_OWNED_GAMES = [
  {
    titleId: "9NBLGGH4NNS1",
    name: "Sea of Thieves",
    currentGamerscore: 980,
    maxGamerscore: 1500,
    minutesPlayed: 8640,
    lastTimePlayed: "2025-06-20T18:00:00Z",
  },
  {
    titleId: "9NBLGGH537BL",
    name: "Minecraft",
    currentGamerscore: 340,
    maxGamerscore: 2000,
    minutesPlayed: 43200,
    lastTimePlayed: "2025-07-01T12:00:00Z",
  },
  {
    titleId: "9P3KMX8TBNKW",
    name: "ELDEN RING",
    currentGamerscore: 1050,
    maxGamerscore: 1750,
    minutesPlayed: 9840,
    lastTimePlayed: "2025-05-15T09:00:00Z",
  },
  {
    titleId: "9NBLGGH5PDLL",
    name: "Grand Theft Auto V",
    currentGamerscore: 760,
    maxGamerscore: 1000,
    minutesPlayed: 18000,
    lastTimePlayed: "2025-04-10T22:00:00Z",
  },
  {
    // No matching GameExternalSource → unmatched
    titleId: "XBOX_EXCLUSIVE_001",
    name: "Halo Infinite",
    currentGamerscore: 2200,
    maxGamerscore: 3000,
    minutesPlayed: 12600,
    lastTimePlayed: "2025-06-01T14:00:00Z",
  },
];

export const XBOX_RAW_API_RESPONSE = {
  titles: XBOX_RAW_OWNED_GAMES,
  totalCount: XBOX_RAW_OWNED_GAMES.length,
};
