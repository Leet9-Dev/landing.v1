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
 *
 * Emitted event types:
 *   user_login | game_hours_daily | game_hours_weekly | game_hours_single |
 *   social_connected | achievement_unlocked | achievement_shared |
 *   game_added | gaming_account_connected | web3_wallet_connected |
 *   profile_updated | friend_invited | friend_activated |
 *   user_followed | follower_gained | game_reviewed | list_created |
 *   game_completed | veteran_milestone
 */

import { checkAndUnlockBadges } from "./badgeEngine.js";
import { updateStreak } from "./streakEngine.js";

const LOOPFREQUENCY_MS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

// Veteran milestone trigger points (total login days).
const VETERAN_MILESTONES = new Set([30, 90, 180]);

/**
 * Main entry point. Call this whenever a user action occurs.
 *
 * @returns {{ event, awarded: Array<{ ruleId, points, label, description }>, badgesUnlocked: string[] }}
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
      awarded.push({
        ruleId: rule.id,
        points: rule.points,
        label: rule.label ?? rule.objective,
        description: rule.description,
      });

      if (rule.brandedName) {
        await prisma.userBrandPoints.upsert({
          where: { userId_brandedName: { userId, brandedName: rule.brandedName } },
          create: { userId, brandedName: rule.brandedName, totalPoints: rule.points },
          update: { totalPoints: { increment: rule.points } },
        });
        brandNamesToCheck.add(rule.brandedName);
      }
    }

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
  const state = await prisma.userRuleState.findUnique({
    where: { userId_ruleId: { userId, ruleId: rule.id } },
  });

  // One-time milestones: skip if already reached.
  if (!rule.looped && state?.milestoneReached) return false;

  // Seasonal window.
  const now = new Date();
  if (rule.startsAt && now < new Date(rule.startsAt)) return false;
  if (rule.endsAt && now > new Date(rule.endsAt)) return false;

  // Profile field check (profile_updated events).
  if (rule.metadata?.field != null) {
    if (payload.field !== rule.metadata.field) return false;
  }

  // Threshold-count checks (connect N accounts, streak N days, etc.).
  if (rule.thresholdCount != null) {
    const count = getPayloadCount(rule, payload);
    if (count == null || count < rule.thresholdCount) return false;
  }

  // Provider-specific social/gaming account rules.
  if (rule.metadata?.provider != null) {
    if (payload.provider !== rule.metadata.provider) return false;
  }

  // Hours-based rules (gamer bonus daily/weekly, single-game mastery).
  if (rule.metadata?.requiredHours != null) {
    const hours = payload.hoursToday ?? payload.hoursThisWeek ?? payload.totalHoursInGame ?? 0;
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
    if (rule.looped && current % rule.metadata.streakDays !== 0) return false;
  }

  return true;
}

/**
 * Extracts the relevant count from the event payload for threshold-based rules.
 */
function getPayloadCount(rule, payload) {
  switch (rule.eventType) {
    case "user_login":                return payload.streakDays ?? null;
    case "social_connected":          return payload.totalSocials ?? null;
    case "gaming_account_connected":  return payload.totalAccounts ?? null;
    case "web3_wallet_connected":     return payload.totalWallets ?? null;
    case "achievement_unlocked":      return payload.totalAchievements ?? null;
    case "achievement_shared":        return payload.totalShared ?? null;
    case "game_added":                return payload.totalGames ?? null;
    case "user_followed":             return payload.totalFollowing ?? null;
    case "follower_gained":           return payload.totalFollowers ?? null;
    case "friend_activated":          return payload.totalActivated ?? null;
    case "game_reviewed":             return payload.totalReviews ?? null;
    case "veteran_milestone":         return payload.totalLoginDays ?? null;
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
  const result = await processEvent(prisma, userId, "user_login", {}, `login:${userId}:${today}`);

  // After a new login event, check veteran milestones (30 / 90 / 180 days).
  if (result.event) {
    const totalLoginDays = await prisma.gamificationEvent.count({
      where: { userId, eventType: "user_login" },
    });
    if (VETERAN_MILESTONES.has(totalLoginDays)) {
      processEvent(
        prisma, userId, "veteran_milestone",
        { totalLoginDays },
        `veteran:${userId}:${totalLoginDays}`
      ).catch(() => {});
    }
  }

  return result;
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

export async function emitGameHoursSingleEvent(prisma, userId, gameId, totalHoursInGame) {
  return processEvent(
    prisma, userId, "game_hours_single",
    { gameId, totalHoursInGame },
    `hours_single:${userId}:${gameId}:500`
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

export async function emitProfileUpdatedEvent(prisma, userId, field) {
  return processEvent(
    prisma, userId, "profile_updated",
    { field },
    `profile_${field}:${userId}`
  );
}

export async function emitFriendInvitedEvent(prisma, userId, inviteCode) {
  return processEvent(
    prisma, userId, "friend_invited",
    { inviteCode },
    `invite:${userId}:${inviteCode}`
  );
}

export async function emitFriendActivatedEvent(prisma, inviterId, inviteeId, totalActivated) {
  return processEvent(
    prisma, inviterId, "friend_activated",
    { inviteeId, totalActivated },
    `activated:${inviterId}:${inviteeId}`
  );
}

export async function emitUserFollowedEvent(prisma, userId, totalFollowing) {
  return processEvent(
    prisma, userId, "user_followed",
    { totalFollowing },
    `followed:${userId}:${totalFollowing}`
  );
}

export async function emitFollowerGainedEvent(prisma, userId, totalFollowers) {
  return processEvent(
    prisma, userId, "follower_gained",
    { totalFollowers },
    `follower:${userId}:${totalFollowers}`
  );
}

export async function emitGameReviewedEvent(prisma, userId, gameId, totalReviews) {
  return processEvent(
    prisma, userId, "game_reviewed",
    { gameId, totalReviews },
    `review:${userId}:${gameId}`
  );
}

export async function emitListCreatedEvent(prisma, userId, listId) {
  return processEvent(
    prisma, userId, "list_created",
    { listId },
    `list:${userId}:${listId}`
  );
}

export async function emitGameCompletedEvent(prisma, userId, gameId) {
  return processEvent(
    prisma, userId, "game_completed",
    { gameId },
    `completed:${userId}:${gameId}`
  );
}

function getISOWeek() {
  const d = new Date();
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
