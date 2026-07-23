/**
 * Gamification engine — event ingestion + rule evaluation + badge checks.
 *
 * Entry point: processEvent(prisma, userId, eventType, payload, idempotencyKey)
 *
 * Flow:
 *   1. Write GamificationEvent (idempotent via unique key)
 *   2. Load all active rules for this eventType
 *   3. For each rule: check eligibility → award points → update state
 *   4. Update UserBrandPoints for any branded rules
 *   5. Check badge tier unlocks
 *   6. Update streak state for login/play events
 */

import { checkAndUnlockBadges } from "./badgeEngine.js";
import { updateStreak } from "./streakEngine.js";

const LOOPFREQUENCY_MS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Main entry point. Call this whenever a user action occurs.
 *
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {string} userId
 * @param {string} eventType  - one of the EVENT_TYPES constants
 * @param {object} payload    - event-specific data (see EVENT_TYPES docs)
 * @param {string} idempotencyKey - unique key to prevent double-processing
 * @returns {{ event, awarded: Array<{ ruleId, points }>, badgesUnlocked: string[] }}
 */
export async function processEvent(prisma, userId, eventType, payload, idempotencyKey) {
  // 1. Write event (idempotent).
  let event;
  try {
    event = await prisma.gamificationEvent.create({
      data: { userId, eventType, payload, idempotencyKey },
    });
  } catch (e) {
    if (e.code === "P2002") {
      // Duplicate idempotency key — already processed, skip silently.
      return { event: null, awarded: [], badgesUnlocked: [] };
    }
    throw e;
  }

  // 2. Load active rules for this event type.
  const rules = await prisma.gamificationRule.findMany({
    where: { eventType, active: true },
  });

  if (rules.length === 0) return { event, awarded: [], badgesUnlocked: [] };

  const awarded = [];
  const brandNamesToCheck = new Set();

  for (const rule of rules) {
    const eligible = await isEligible(prisma, userId, rule, payload);
    if (!eligible) continue;

    // Award points.
    if (rule.points != null && rule.points > 0) {
      await prisma.pointsLedger.create({
        data: {
          userId,
          ruleId: rule.id,
          eventId: event.id,
          points: rule.points,
          note: rule.description,
        },
      });
      awarded.push({ ruleId: rule.id, points: rule.points });

      // Update brand points total.
      if (rule.brandedName) {
        await prisma.userBrandPoints.upsert({
          where: { userId_brandedName: { userId, brandedName: rule.brandedName } },
          create: { userId, brandedName: rule.brandedName, totalPoints: rule.points },
          update: { totalPoints: { increment: rule.points } },
        });
        brandNamesToCheck.add(rule.brandedName);
      }
    }

    // Update rule state.
    await updateRuleState(prisma, userId, rule);
  }

  // 3. Badge checks for all affected brand families.
  const badgesUnlocked = [];
  for (const brandedName of brandNamesToCheck) {
    const unlocked = await checkAndUnlockBadges(prisma, userId, brandedName);
    badgesUnlocked.push(...unlocked);
  }

  // 4. Streak updates for login and play events.
  if (eventType === "user_login") {
    await updateStreak(prisma, userId, "login_daily");
  }
  if (eventType === "game_hours_weekly") {
    await updateStreak(prisma, userId, "play_weekly");
  }

  return { event, awarded, badgesUnlocked };
}

/**
 * Determines whether a rule should fire for this user and event payload.
 */
async function isEligible(prisma, userId, rule, payload) {
  // Load or initialise per-user rule state.
  const state = await prisma.userRuleState.findUnique({
    where: { userId_ruleId: { userId, ruleId: rule.id } },
  });

  // One-time milestones: skip if already reached.
  if (!rule.looped && state?.milestoneReached) return false;

  // Threshold-count checks (connect N accounts, streak N days, etc.).
  if (rule.thresholdCount != null) {
    const count = getPayloadCount(rule, payload);
    if (count == null || count < rule.thresholdCount) return false;
  }

  // Provider-specific social/gaming account rules.
  if (rule.metadata?.provider != null) {
    if (payload.provider !== rule.metadata.provider) return false;
  }

  // Hours-based rules (gamer bonus daily/weekly).
  if (rule.metadata?.requiredHours != null) {
    const hours = payload.hoursToday ?? payload.hoursThisWeek ?? 0;
    if (hours < rule.metadata.requiredHours) return false;
  }

  // Looped frequency cap: has enough time passed since last fire?
  if (rule.looped && rule.loopFrequency && state?.lastFiredAt) {
    const elapsed = Date.now() - new Date(state.lastFiredAt).getTime();
    const required = LOOPFREQUENCY_MS[rule.loopFrequency] ?? 0;
    if (elapsed < required) return false;
  }

  // Yearly max cap.
  if (rule.yearlyMaxPoints != null && state) {
    const thisYear = getCurrentYear();
    const stateYear = state.yearResetAt ? new Date(state.yearResetAt).getFullYear() : null;
    const pointsThisYear = stateYear === thisYear ? state.pointsThisYear : 0;
    if (pointsThisYear + (rule.points ?? 0) > rule.yearlyMaxPoints) return false;
  }

  // Login streak milestones: check current streak matches threshold.
  if (rule.eventType === "user_login" && rule.metadata?.streakDays != null) {
    const streak = await prisma.userStreak.findUnique({
      where: { userId_streakType: { userId, streakType: "login_daily" } },
    });
    const current = streak?.currentStreak ?? 0;
    if (current < rule.metadata.streakDays) return false;
    // For looped streaks (7-day): only fire when streak is exactly a multiple of streakDays.
    if (rule.looped && current % rule.metadata.streakDays !== 0) return false;
  }

  return true;
}

/**
 * Extracts the relevant count from the event payload for threshold-based rules.
 */
function getPayloadCount(rule, payload) {
  switch (rule.eventType) {
    case "user_login":          return payload.streakDays ?? null;
    case "social_connected":    return payload.totalSocials ?? null;
    case "gaming_account_connected": return payload.totalAccounts ?? null;
    case "web3_wallet_connected":    return payload.totalWallets ?? null;
    case "achievement_unlocked":     return payload.totalAchievements ?? null;
    case "achievement_shared":       return payload.totalShared ?? null;
    case "game_added":               return payload.totalGames ?? null;
    default: return null;
  }
}

/**
 * Updates UserRuleState after a successful award.
 */
async function updateRuleState(prisma, userId, rule) {
  const thisYear = getCurrentYear();
  const now = new Date();

  const existing = await prisma.userRuleState.findUnique({
    where: { userId_ruleId: { userId, ruleId: rule.id } },
  });

  const stateYear = existing?.yearResetAt ? new Date(existing.yearResetAt).getFullYear() : null;
  const pointsThisYear = stateYear === thisYear
    ? (existing.pointsThisYear ?? 0) + (rule.points ?? 0)
    : (rule.points ?? 0);

  await prisma.userRuleState.upsert({
    where: { userId_ruleId: { userId, ruleId: rule.id } },
    create: {
      userId,
      ruleId: rule.id,
      firedCount: 1,
      pointsThisYear,
      yearResetAt: now,
      lastFiredAt: now,
      milestoneReached: !rule.looped,
    },
    update: {
      firedCount: { increment: 1 },
      pointsThisYear,
      yearResetAt: stateYear !== thisYear ? now : existing?.yearResetAt,
      lastFiredAt: now,
      milestoneReached: rule.looped ? undefined : true,
    },
  });
}

function getCurrentYear() {
  return new Date().getFullYear();
}

// ---------------------------------------------------------------------------
// Convenience helpers for callers — pre-built event dispatchers
// ---------------------------------------------------------------------------

export async function emitLoginEvent(prisma, userId) {
  const today = new Date().toISOString().slice(0, 10);
  return processEvent(prisma, userId, "user_login", {}, `login:${userId}:${today}`);
}

export async function emitGameAddedEvent(prisma, userId, gameId, totalGames) {
  return processEvent(
    prisma, userId, "game_added",
    { gameId, totalGames },
    `game_added:${userId}:${gameId}`
  );
}

export async function emitGamingAccountConnectedEvent(prisma, userId, provider, totalAccounts) {
  return processEvent(
    prisma, userId, "gaming_account_connected",
    { provider, totalAccounts },
    `gaming_account:${userId}:${provider}`
  );
}

export async function emitSocialConnectedEvent(prisma, userId, provider, totalSocials) {
  return processEvent(
    prisma, userId, "social_connected",
    { provider, totalSocials },
    `social:${userId}:${provider}`
  );
}

export async function emitWeb3WalletConnectedEvent(prisma, userId, address, totalWallets) {
  return processEvent(
    prisma, userId, "web3_wallet_connected",
    { address, totalWallets },
    `web3:${userId}:${address}`
  );
}

export async function emitGameHoursDailyEvent(prisma, userId, gameId, hoursToday) {
  const today = new Date().toISOString().slice(0, 10);
  return processEvent(
    prisma, userId, "game_hours_daily",
    { gameId, hoursToday },
    `hours_daily:${userId}:${gameId}:${today}`
  );
}

export async function emitGameHoursWeeklyEvent(prisma, userId, hoursThisWeek) {
  const week = getISOWeek();
  return processEvent(
    prisma, userId, "game_hours_weekly",
    { hoursThisWeek },
    `hours_weekly:${userId}:${week}`
  );
}

export async function emitAchievementUnlockedEvent(prisma, userId, totalAchievements) {
  return processEvent(
    prisma, userId, "achievement_unlocked",
    { totalAchievements },
    `achievements:${userId}:${totalAchievements}`
  );
}

export async function emitAchievementSharedEvent(prisma, userId, totalShared) {
  return processEvent(
    prisma, userId, "achievement_shared",
    { totalShared },
    `shared:${userId}:${totalShared}`
  );
}

function getISOWeek() {
  const d = new Date();
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
