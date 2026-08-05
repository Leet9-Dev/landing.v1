// Realistic mock Ubisoft Connect library responses for dry-run testing.
//
// Covers:
//   1. Rainbow Six Siege → matches game_rainbow_six_siege
//   2. Assassin's Creed Odyssey → unmatched (not in canonical catalogue yet)
//   3. Far Cry 6 → unmatched
//   4. The Division 2 → unmatched

export const UBISOFT_RAW_OWNED_GAMES = [
  {
    spaceId: "rainbow_six_siege",
    name: "Tom Clancy's Rainbow Six Siege",
    lastPlayedAt: "2025-07-19T20:00:00Z",
  },
  {
    spaceId: "assassins_creed_odyssey",
    name: "Assassin's Creed Odyssey",
    lastPlayedAt: "2025-06-15T14:00:00Z",
  },
  {
    spaceId: "far_cry_6",
    name: "Far Cry 6",
    lastPlayedAt: "2025-05-10T18:00:00Z",
  },
  {
    spaceId: "the_division_2",
    name: "Tom Clancy's The Division 2",
    lastPlayedAt: "2025-04-20T21:00:00Z",
  },
];
