/**
 * Seeds P0 GamificationRule records per §4 of the Gamification Spec v2.1.
 *
 * Event names are bridged to the current engine's v1 names; canonical v2.1
 * names (login_recorded, play_hour_verified, platform_connected …) will
 * replace them when the engine emitters are migrated in Phase 0 workstream 0.2.
 *
 * Run:  npx prisma db seed
 * Safe: all upserts on id — re-running never duplicates rows.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const RULES = [
  // -------------------------------------------------------------------------
  // Login (§4: login → user_login → 20 XP/SP, 1/day)
  // -------------------------------------------------------------------------
  {
    id: "login_daily",
    family: "user_retention",
    objective: "login_bonus",
    type: "activity",
    active: true,
    label: "Daily Login",
    description: "You showed up — +20 XP.",
    looped: true,
    loopFrequency: "daily",
    points: 20,
    eventType: "user_login",
    yearlyMaxPoints: null,
    metadata: null,
  },

  // -------------------------------------------------------------------------
  // Streak milestones (§4: streak_ms_7/30/100/365 → user_login)
  // -------------------------------------------------------------------------
  {
    id: "streak_ms_7",
    family: "user_retention",
    objective: "streak_milestone",
    type: "milestone",
    active: true,
    label: "7-Day Streak",
    description: "7 days straight — streak milestone! +100 XP.",
    looped: false,
    loopFrequency: null,
    points: 100,
    eventType: "user_login",
    metadata: { streakDays: 7 },
  },
  {
    id: "streak_ms_30",
    family: "user_retention",
    objective: "streak_milestone",
    type: "milestone",
    active: true,
    label: "30-Day Streak",
    description: "A whole month — 30-day streak! +500 XP.",
    looped: false,
    loopFrequency: null,
    points: 500,
    eventType: "user_login",
    metadata: { streakDays: 30 },
  },
  {
    id: "streak_ms_100",
    family: "user_retention",
    objective: "streak_milestone",
    type: "milestone",
    active: true,
    label: "100-Day Streak",
    description: "100 days — legendary. +2,000 XP.",
    looped: false,
    loopFrequency: null,
    points: 2000,
    eventType: "user_login",
    metadata: { streakDays: 100 },
  },
  {
    id: "streak_ms_365",
    family: "user_retention",
    objective: "streak_milestone",
    type: "milestone",
    active: true,
    label: "365-Day Streak",
    description: "A full year. Nothing else to say. +10,000 XP.",
    looped: false,
    loopFrequency: null,
    points: 10000,
    eventType: "user_login",
    metadata: { streakDays: 365 },
  },

  // -------------------------------------------------------------------------
  // Play hours (§4: play_hour → game_hours_daily → 30 XP/SP, 4h/day cap)
  // Simplified: flat 30 XP when ≥1h played in a day. Full per-hour tracking
  // comes with the engine emitter migration (workstream 0.2).
  // -------------------------------------------------------------------------
  {
    id: "play_hour_daily",
    family: "video_game",
    objective: "gamer_bonus_daily",
    type: "activity",
    active: true,
    label: "Daily Play",
    description: "An hour of real gaming — +30 XP.",
    looped: true,
    loopFrequency: "daily",
    points: 30,
    eventType: "game_hours_daily",
    yearlyMaxPoints: null,
    metadata: { requiredHours: 1 },
  },

  // -------------------------------------------------------------------------
  // Gaming platform connects (§4: connect_gaming → gaming_account_connected)
  // 150 XP per platform, max 5 credited. One rule per milestone.
  // -------------------------------------------------------------------------
  {
    id: "connect_gaming_1",
    family: "prerequisite",
    objective: "platform_connect",
    type: "milestone",
    active: true,
    label: "First Platform Connected",
    description: "First gaming account connected — +150 XP.",
    looped: false,
    loopFrequency: null,
    points: 150,
    eventType: "gaming_account_connected",
    thresholdCount: 1,
  },
  {
    id: "connect_gaming_2",
    family: "prerequisite",
    objective: "platform_connect",
    type: "milestone",
    active: true,
    label: "Second Platform Connected",
    description: "Second gaming account connected — +150 XP.",
    looped: false,
    loopFrequency: null,
    points: 150,
    eventType: "gaming_account_connected",
    thresholdCount: 2,
  },
  {
    id: "connect_gaming_3",
    family: "prerequisite",
    objective: "platform_connect",
    type: "milestone",
    active: true,
    label: "Third Platform Connected",
    description: "Three platforms, one identity — +150 XP.",
    looped: false,
    loopFrequency: null,
    points: 150,
    eventType: "gaming_account_connected",
    thresholdCount: 3,
  },
  {
    id: "connect_gaming_4",
    family: "prerequisite",
    objective: "platform_connect",
    type: "milestone",
    active: true,
    label: "Fourth Platform Connected",
    description: "Four platforms connected — +150 XP.",
    looped: false,
    loopFrequency: null,
    points: 150,
    eventType: "gaming_account_connected",
    thresholdCount: 4,
  },
  {
    id: "connect_gaming_5",
    family: "prerequisite",
    objective: "platform_connect",
    type: "milestone",
    active: true,
    label: "Fifth Platform Connected",
    description: "Five platforms — the full picture. +150 XP.",
    looped: false,
    loopFrequency: null,
    points: 150,
    eventType: "gaming_account_connected",
    thresholdCount: 5,
  },

  // -------------------------------------------------------------------------
  // Social connects (§4: connect_social → social_connected)
  // 100 XP per social account, max 3 credited.
  // -------------------------------------------------------------------------
  {
    id: "connect_social_1",
    family: "sharing",
    objective: "social_connect",
    type: "milestone",
    active: true,
    label: "First Social Connected",
    description: "First social account linked — +100 XP.",
    looped: false,
    loopFrequency: null,
    points: 100,
    eventType: "social_connected",
    thresholdCount: 1,
  },
  {
    id: "connect_social_2",
    family: "sharing",
    objective: "social_connect",
    type: "milestone",
    active: true,
    label: "Second Social Connected",
    description: "Second social account linked — +100 XP.",
    looped: false,
    loopFrequency: null,
    points: 100,
    eventType: "social_connected",
    thresholdCount: 2,
  },
  {
    id: "connect_social_3",
    family: "sharing",
    objective: "social_connect",
    type: "milestone",
    active: true,
    label: "Third Social Connected",
    description: "Third social account linked — +100 XP.",
    looped: false,
    loopFrequency: null,
    points: 100,
    eventType: "social_connected",
    thresholdCount: 3,
  },

  // -------------------------------------------------------------------------
  // Shares (§4: share → achievement_shared → 25 XP, 1/day)
  // -------------------------------------------------------------------------
  {
    id: "share_daily",
    family: "sharing",
    objective: "sharing_bonus",
    type: "activity",
    active: true,
    label: "Daily Share",
    description: "Shared an achievement — +25 XP.",
    looped: true,
    loopFrequency: "daily",
    points: 25,
    eventType: "achievement_shared",
    yearlyMaxPoints: null,
    metadata: null,
  },

  // -------------------------------------------------------------------------
  // Achievement milestones (§4: achievement → achievement_unlocked)
  // Rarity-weighted per-achievement XP requires engine changes (workstream 0.2).
  // Seeding cumulative milestones as an approximation.
  // -------------------------------------------------------------------------
  {
    id: "achievement_ms_50",
    family: "video_game",
    objective: "achievement_milestone",
    type: "milestone",
    active: true,
    label: "50 Achievements",
    description: "50 achievements unlocked — +250 XP.",
    looped: false,
    loopFrequency: null,
    points: 250,
    eventType: "achievement_unlocked",
    thresholdCount: 50,
  },
  {
    id: "achievement_ms_250",
    family: "video_game",
    objective: "achievement_milestone",
    type: "milestone",
    active: true,
    label: "250 Achievements",
    description: "250 achievements — hardcore. +500 XP.",
    looped: false,
    loopFrequency: null,
    points: 500,
    eventType: "achievement_unlocked",
    thresholdCount: 250,
  },
  {
    id: "achievement_ms_1000",
    family: "video_game",
    objective: "achievement_milestone",
    type: "milestone",
    active: true,
    label: "1,000 Achievements",
    description: "1,000 achievements. A legend. +800 XP.",
    looped: false,
    loopFrequency: null,
    points: 800,
    eventType: "achievement_unlocked",
    thresholdCount: 1000,
  },

  // -------------------------------------------------------------------------
  // Game library (§4: new_title_launch → game_added → 10 XP per new title)
  // -------------------------------------------------------------------------
  {
    id: "new_title_launch",
    family: "video_game",
    objective: "library_growth",
    type: "activity",
    active: true,
    label: "New Title Added",
    description: "Added a new game to your library — +10 XP.",
    looped: true,
    loopFrequency: null,
    points: 10,
    eventType: "game_added",
    yearlyMaxPoints: null,
    metadata: null,
  },

  // -------------------------------------------------------------------------
  // Veteran milestones (§4: legacy / user retention)
  // -------------------------------------------------------------------------
  {
    id: "veteran_30",
    family: "user_retention",
    objective: "veteran_milestone",
    type: "milestone",
    active: true,
    label: "30-Day Veteran",
    description: "30 days on Leet9 — you're part of the family. +100 XP.",
    looped: false,
    loopFrequency: null,
    points: 100,
    eventType: "veteran_milestone",
    thresholdCount: 30,
  },
  {
    id: "veteran_90",
    family: "user_retention",
    objective: "veteran_milestone",
    type: "milestone",
    active: true,
    label: "90-Day Veteran",
    description: "90 days — dedicated. +300 XP.",
    looped: false,
    loopFrequency: null,
    points: 300,
    eventType: "veteran_milestone",
    thresholdCount: 90,
  },
  {
    id: "veteran_180",
    family: "user_retention",
    objective: "veteran_milestone",
    type: "milestone",
    active: true,
    label: "180-Day Veteran",
    description: "6 months on Leet9 — you're a cornerstone. +500 XP.",
    looped: false,
    loopFrequency: null,
    points: 500,
    eventType: "veteran_milestone",
    thresholdCount: 180,
  },

  // -------------------------------------------------------------------------
  // Social graph (§4: user_followed, follower_gained, friend_activated)
  // -------------------------------------------------------------------------
  {
    id: "follow_first",
    family: "social",
    objective: "social_graph",
    type: "milestone",
    active: true,
    label: "First Follow",
    description: "Followed your first gamer — +50 XP.",
    looped: false,
    loopFrequency: null,
    points: 50,
    eventType: "user_followed",
    thresholdCount: 1,
  },
  {
    id: "friend_activated_1",
    family: "social",
    objective: "referral",
    type: "milestone",
    active: true,
    label: "First Friend Activated",
    description: "A friend you invited joined and connected a platform — +100 XP.",
    looped: false,
    loopFrequency: null,
    points: 100,
    eventType: "friend_activated",
    thresholdCount: 1,
  },
  {
    id: "friend_activated_5",
    family: "social",
    objective: "referral",
    type: "milestone",
    active: true,
    label: "5 Friends Activated",
    description: "5 friends brought in — +300 XP.",
    looped: false,
    loopFrequency: null,
    points: 300,
    eventType: "friend_activated",
    thresholdCount: 5,
  },

  // -------------------------------------------------------------------------
  // Profile completeness (§4: profile_updated)
  // -------------------------------------------------------------------------
  {
    id: "profile_avatar",
    family: "prerequisite",
    objective: "profile_complete",
    type: "milestone",
    active: true,
    label: "Profile Picture Set",
    description: "You've got a face — +25 XP.",
    looped: false,
    loopFrequency: null,
    points: 25,
    eventType: "profile_updated",
    metadata: { field: "avatar" },
  },
  {
    id: "profile_bio",
    family: "prerequisite",
    objective: "profile_complete",
    type: "milestone",
    active: true,
    label: "Bio Written",
    description: "You've told your story — +25 XP.",
    looped: false,
    loopFrequency: null,
    points: 25,
    eventType: "profile_updated",
    metadata: { field: "bio" },
  },
];

async function main() {
  console.log(`Seeding ${RULES.length} P0 GamificationRule records…`);

  let created = 0;
  let skipped = 0;

  for (const rule of RULES) {
    const result = await prisma.gamificationRule.upsert({
      where: { id: rule.id },
      create: rule,
      update: {},  // never overwrite — manual edits in DB win
    });
    if (result.createdAt === result.updatedAt) {
      created++;
    } else {
      skipped++;
    }
  }

  // Ensure the welcome bonus rule exists (also seeded by emitWelcomeEvent,
  // but we include it here so the seed is the authoritative source).
  await prisma.gamificationRule.upsert({
    where: { id: "welcome_bonus" },
    create: {
      id: "welcome_bonus",
      family: "prerequisite",
      objective: "onboarding",
      type: "activity",
      active: true,
      label: "Welcome to Leet9",
      description: "Welcome to Leet9! Here are 500 XP to kick off your gaming identity.",
      looped: false,
      loopFrequency: null,
      points: 500,
      eventType: "user_registered",
      yearlyMaxPoints: 500,
    },
    update: {},
  });

  console.log(`Done. Created: ${created + 1}  Already present: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
