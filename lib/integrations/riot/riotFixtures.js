// Realistic mock Riot Games account response for dry-run testing.
//
// Riot does not expose a traditional "game library" — instead, the Riot API
// reports which products an account is active on (League of Legends, Valorant,
// TFT, etc.). These fixtures simulate the resolved product list for an account.
//
// Most Riot titles are not in the canonical Leet9 catalogue yet, so they will
// appear as unmatched — this is correct intended behavior.

export const RIOT_RAW_GAMES = [
  {
    productId: "valorant",
    name: "Valorant",
    hoursPlayed: null, // Riot API does not expose playtime
    lastPlayedAt: "2025-07-10T20:00:00Z",
  },
  {
    productId: "league_of_legends",
    name: "League of Legends",
    hoursPlayed: null,
    lastPlayedAt: "2025-07-18T19:30:00Z",
  },
  {
    productId: "teamfight_tactics",
    name: "Teamfight Tactics",
    hoursPlayed: null,
    lastPlayedAt: "2025-07-05T21:00:00Z",
  },
  {
    productId: "legends_of_runeterra",
    name: "Legends of Runeterra",
    hoursPlayed: null,
    lastPlayedAt: "2025-03-01T16:00:00Z",
  },
];

export const RIOT_RAW_API_RESPONSE = {
  puuid: "fixture-puuid-0000-0000-0000",
  gameName: "ShadowViper",
  tagLine: "EUW",
  games: RIOT_RAW_GAMES,
};
