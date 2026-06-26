// Mock computed stats summary for the current user (mock-user-001).
// Shapes follow docs/architecture/DATA_MODEL.md (StatsSummary) and the
// GET /api/me/stats contract. Values are intentionally consistent with
// lib/mock/currentUser.js and lib/mock/userGames.js so the Profile feels
// coherent across tabs. Canonical game data is referenced by gameId and
// joined at the API layer — never duplicated here.
export const MOCK_STATS_SUMMARY = {
  userId: "mock-user-001",

  totalL9Points: 21339,
  totalHours: 1769,
  gamesTracked: 4,
  activeGames: 3,
  achievementsUnlocked: 104,
  profileCompletenessPct: 72,

  // How much of the user's signal comes from each connected platform.
  platformSplit: [
    { provider: "steam", pct: 68 },
    { provider: "psn", pct: 32 },
  ],

  // What the user's L9 points are made of. Sums to 100.
  pointsBreakdown: [
    { label: "Playtime", pct: 46, basedOn: "Hours played across tracked games" },
    { label: "Achievements", pct: 28, basedOn: "Total achievements and trophies unlocked" },
    { label: "Rarity", pct: 17, basedOn: "How rare your unlocked achievements are" },
    { label: "Consistency", pct: 9, basedOn: "Active weeks and recent momentum" },
  ],

  // Trailing 6 months, oldest first.
  monthly: [
    { month: "2025-01", l9Points: 1840, hours: 96, achievements: 11, rareUnlocks: 1 },
    { month: "2025-02", l9Points: 2210, hours: 118, achievements: 14, rareUnlocks: 2 },
    { month: "2025-03", l9Points: 1980, hours: 104, achievements: 9, rareUnlocks: 1 },
    { month: "2025-04", l9Points: 2670, hours: 141, achievements: 17, rareUnlocks: 3 },
    { month: "2025-05", l9Points: 3120, hours: 162, achievements: 19, rareUnlocks: 2 },
    { month: "2025-06", l9Points: 3580, hours: 178, achievements: 22, rareUnlocks: 4 },
  ],

  // Referenced by gameId; titles/studios joined from lib/mock/games.js.
  topGamesByHours: [
    { gameId: "game_rocket_league", hours: 1284 },
    { gameId: "game_elden_ring", hours: 284.5 },
    { gameId: "game_cyberpunk_2077", hours: 142 },
    { gameId: "game_hollow_knight", hours: 58.4 },
  ],

  rarityBreakdown: [
    { rarity: "Common", count: 61 },
    { rarity: "Rare", count: 28 },
    { rarity: "Epic", count: 11 },
    { rarity: "Legendary", count: 3 },
    { rarity: "Platinum", count: 1 },
  ],

  mastery: {
    averagePct: 57.6,
    above80Count: 1,
    above50Count: 2,
    highestGameId: "game_rocket_league",
    highestPct: 86.5,
  },

  genres: [
    { genre: "Action RPG", share: 34 },
    { genre: "Sports", share: 26 },
    { genre: "Open World", share: 18 },
    { genre: "Metroidvania", share: 12 },
    { genre: "Roguelike", share: 10 },
  ],

  momentum: {
    pointsThisMonth: 3580,
    pointsLastMonth: 3120,
    momChangePct: 14.7,
    hoursThisMonth: 178,
    achievementsThisMonth: 22,
    activeWeeksStreak: 6,
    mostActiveGameId: "game_cyberpunk_2077",
  },

  // Each signal explains itself via `basedOn`. Scores are 0–100.
  dna: [
    { label: "Specialist", score: 82, basedOn: "Most hours concentrated in a few core games" },
    { label: "Competitive", score: 71, basedOn: "Ranked play and high Rocket League mastery" },
    { label: "Consistency", score: 64, basedOn: "6-week active streak with steady monthly points" },
    { label: "Completionist", score: 48, basedOn: "Average mastery of 58% across tracked games" },
    { label: "Collector", score: 33, basedOn: "Breadth of achievements relative to library size" },
  ],

  // Confidence reflects how much real platform data backs these numbers.
  confidence: "Medium-high",
  confidenceReason:
    "Based on 1 fully synced platform (Steam). Connect PSN to raise confidence to High.",

  calculatedAt: "2025-06-24T21:00:00Z",
};
