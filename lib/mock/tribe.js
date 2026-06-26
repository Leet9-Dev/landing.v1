// Detailed mock data for the current user's tribe (Neon Wolves / NW9).
// Kept consistent with lib/mock/tribes.js (the rankings view): same id, name,
// tag, global rank 3, 41 members, 947K L9 points, 264 games, 14,210 achievements.
// Canonical game data is referenced by gameId and joined at the API layer —
// never duplicated here.
export const MOCK_TRIBE = {
  id: "tribe_neon_wolves",
  name: "Neon Wolves",
  tag: "NW9",
  motto: "Hunt in packs. Climb as one.",
  emblem: { initials: "NW", gradient: "linear-gradient(135deg,#0a1a08,#16a34a)" },
  access: "invite_only",

  globalRank: 3,
  totalL9Points: 947000,
  maxMembers: 50,
  membersCount: 41,
  uniqueGamesPlayed: 264,
  achievementsEarned: 14210,

  // Games most played across the tribe. Referenced by gameId.
  mostPlayedGames: [
    { gameId: "game_rocket_league", membersCount: 22, tribeL9Points: 184200, achievementsCount: 1840, hoursPlayed: 41280 },
    { gameId: "game_elden_ring", membersCount: 18, tribeL9Points: 152800, achievementsCount: 1520, hoursPlayed: 28940 },
    { gameId: "game_cyberpunk_2077", membersCount: 15, tribeL9Points: 121400, achievementsCount: 1190, hoursPlayed: 21470 },
    { gameId: "game_ea_fc_25", membersCount: 13, tribeL9Points: 98600, achievementsCount: 980, hoursPlayed: 18230 },
    { gameId: "game_baldurs_gate_3", membersCount: 11, tribeL9Points: 87300, achievementsCount: 870, hoursPlayed: 14910 },
  ],
};

// A representative slice of members (8 of 41). Roles: founder, council, member.
// The current user (mock-user-001) is included and flagged.
export const MOCK_TRIBE_MEMBERS = [
  {
    id: "tm_neon_wolves_bytereaper",
    tribeId: "tribe_neon_wolves",
    userId: "user_bytereaper",
    gamerTag: "ByteReaper",
    avatarInitials: "BR",
    role: "founder",
    l9PointsContribution: 92400,
    gamesPlayed: 71,
    achievementsEarned: 356,
    lastPlayedGameId: "game_elden_ring",
    lastActiveAtLabel: "2h ago",
  },
  {
    id: "tm_neon_wolves_novaprime",
    tribeId: "tribe_neon_wolves",
    userId: "user_novaprime",
    gamerTag: "NovaPrime",
    avatarInitials: "NP",
    role: "council",
    l9PointsContribution: 81200,
    gamesPlayed: 58,
    achievementsEarned: 312,
    lastPlayedGameId: "game_rocket_league",
    lastActiveAtLabel: "5h ago",
  },
  {
    id: "tm_neon_wolves_shadowviper99",
    tribeId: "tribe_neon_wolves",
    userId: "mock-user-001",
    gamerTag: "ShadowViper99",
    avatarInitials: "SV",
    role: "council",
    l9PointsContribution: 21339,
    gamesPlayed: 38,
    achievementsEarned: 198,
    lastPlayedGameId: "game_cyberpunk_2077",
    lastActiveAtLabel: "Today",
    isCurrentUser: true,
  },
  {
    id: "tm_neon_wolves_emberwraith",
    tribeId: "tribe_neon_wolves",
    userId: "user_emberwraith",
    gamerTag: "EmberWraith",
    avatarInitials: "EW",
    role: "member",
    l9PointsContribution: 15620,
    gamesPlayed: 29,
    achievementsEarned: 152,
    lastPlayedGameId: "game_god_of_war_ragnarok",
    lastActiveAtLabel: "1d ago",
  },
  {
    id: "tm_neon_wolves_frostbyte",
    tribeId: "tribe_neon_wolves",
    userId: "user_frostbyte",
    gamerTag: "FrostByte",
    avatarInitials: "FB",
    role: "member",
    l9PointsContribution: 13880,
    gamesPlayed: 24,
    achievementsEarned: 131,
    lastPlayedGameId: "game_baldurs_gate_3",
    lastActiveAtLabel: "3h ago",
  },
  {
    id: "tm_neon_wolves_voidrunner",
    tribeId: "tribe_neon_wolves",
    userId: "user_voidrunner",
    gamerTag: "VoidRunner",
    avatarInitials: "VR",
    role: "member",
    l9PointsContribution: 11240,
    gamesPlayed: 21,
    achievementsEarned: 108,
    lastPlayedGameId: "game_hollow_knight",
    lastActiveAtLabel: "2d ago",
  },
  {
    id: "tm_neon_wolves_ashwolf",
    tribeId: "tribe_neon_wolves",
    userId: "user_ashwolf",
    gamerTag: "AshWolf",
    avatarInitials: "AW",
    role: "member",
    l9PointsContribution: 9810,
    gamesPlayed: 19,
    achievementsEarned: 94,
    lastPlayedGameId: "game_ea_fc_25",
    lastActiveAtLabel: "6h ago",
  },
  {
    id: "tm_neon_wolves_neonhowl",
    tribeId: "tribe_neon_wolves",
    userId: "user_neonhowl",
    gamerTag: "NeonHowl",
    avatarInitials: "NH",
    role: "member",
    l9PointsContribution: 7420,
    gamesPlayed: 16,
    achievementsEarned: 77,
    lastPlayedGameId: "game_spiderman_2",
    lastActiveAtLabel: "4d ago",
  },
];

// The current user's own member record (mirrors the flagged entry above).
export const MOCK_CURRENT_MEMBER = MOCK_TRIBE_MEMBERS.find((m) => m.isCurrentUser);

// Tribe management is intentionally deferred for this phase: every action is
// disabled. The UI uses this to render clearly non-functional placeholders.
export const MOCK_TRIBE_PERMISSIONS = {
  canInvite: false,
  canKick: false,
  canPromoteCouncil: false,
  canPromoteFounder: false,
  canEditTribe: false,
  canLeave: false,
};
