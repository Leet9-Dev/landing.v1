// Realistic mock EA App owned-game responses for dry-run testing.
//
// Shape approximates an EA App game library response.
// Fixtures cover:
//   1. Apex Legends → matches game_apex_legends
//   2. EA Sports FC 25 → matches game_ea_fc_25
//   3. Unmatched EA titles (Battlefield, Sims)

export const EA_RAW_OWNED_GAMES = [
  {
    productId: "apex_legends",
    displayName: "Apex Legends",
    lastPlayedAt: "2025-07-20T19:00:00Z",
  },
  {
    productId: "fc25",
    displayName: "EA Sports FC 25",
    lastPlayedAt: "2025-07-18T16:00:00Z",
  },
  {
    // Unmatched — not in canonical catalogue
    productId: "battlefield_2042",
    displayName: "Battlefield 2042",
    lastPlayedAt: "2025-06-10T21:00:00Z",
  },
  {
    // Unmatched — not in canonical catalogue
    productId: "sims4",
    displayName: "The Sims 4",
    lastPlayedAt: "2025-05-01T14:00:00Z",
  },
];

export const EA_RAW_API_RESPONSE = {
  persona: { displayName: "ShadowViper99", personaId: "fixture-ea-persona-id" },
  games: EA_RAW_OWNED_GAMES,
};
