/**
 * Streak engine — manages consecutive login (daily) and play (weekly) streaks.
 *
 * Called by engine.js after user_login and game_hours_weekly events.
 * Streak breaks if the user misses a day (login) or a week (play).
 * E5 v2: freeze tokens absorb a single missed period before breaking.
 */

import { getConfig } from "./config.js";

// XP awarded at streak milestones (login_daily only).
const MILESTONE_XP = { 7: 50, 30: 200, 100: 500, 365: 2000 };

/**
 * Updates the streak for a given streakType.
 * Increments currentStreak on consecutive activity, resets to 1 on a gap.
 * When a gap is detected and freezeTokens > 0, consumes one token instead of resetting.
 *
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {string} userId
 * @param {"login_daily"|"play_weekly"} streakType
 */
export async function updateStreak(prisma, userId, streakType) {
  const now = new Date();
  const todayKey = streakType === "login_daily"
    ? getDayKey(now)
    : getWeekKey(now);

  const existing = await prisma.userStreak.findUnique({
    where: { userId_streakType: { userId, streakType } },
  });

  if (!existing) {
    await prisma.userStreak.create({
      data: {
        userId,
        streakType,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: now,
        streakStartedAt: now,
      },
    });
    await checkStreakMilestones(prisma, userId, streakType, 1);
    return;
  }

  const lastKey = existing.lastActivityDate
    ? (streakType === "login_daily"
        ? getDayKey(existing.lastActivityDate)
        : getWeekKey(existing.lastActivityDate))
    : null;

  // Already updated this period — no change needed.
  if (lastKey === todayKey) return;

  const prevKey = streakType === "login_daily"
    ? getPreviousDayKey(now)
    : getPreviousWeekKey(now);

  const isConsecutive = lastKey === prevKey;

  let newStreak;
  let updateData;

  if (isConsecutive) {
    newStreak = existing.currentStreak + 1;
    updateData = {
      currentStreak: newStreak,
      longestStreak: Math.max(existing.longestStreak, newStreak),
      lastActivityDate: now,
      streakStartedAt: existing.streakStartedAt,
    };
  } else if ((existing.freezeTokens ?? 0) > 0) {
    // Consume one freeze token — streak survives the missed period.
    newStreak = existing.currentStreak + 1;
    updateData = {
      currentStreak: newStreak,
      longestStreak: Math.max(existing.longestStreak, newStreak),
      lastActivityDate: now,
      streakStartedAt: existing.streakStartedAt,
      freezeTokens: existing.freezeTokens - 1,
      lastFreezeUsedAt: now,
    };
  } else {
    newStreak = 1;
    updateData = {
      currentStreak: 1,
      longestStreak: existing.longestStreak,
      lastActivityDate: now,
      streakStartedAt: now,
    };
  }

  await prisma.userStreak.update({
    where: { userId_streakType: { userId, streakType } },
    data: updateData,
  });

  await checkStreakMilestones(prisma, userId, streakType, newStreak);
}

/**
 * Awards XP for streak milestones (7/30/100/365 days), login_daily only.
 * Idempotent via XpLedger idempotencyKey.
 */
async function checkStreakMilestones(prisma, userId, streakType, newStreak) {
  if (streakType !== "login_daily") return;
  const xp = MILESTONE_XP[newStreak];
  if (!xp) return;

  const idempotencyKey = `streak_milestone:${userId}:${streakType}:${newStreak}`;

  const spMultiplier = parseFloat((await getConfig("sp.multiplier").catch(() => "1")) ?? "1");
  const spDelta = Math.round(xp * spMultiplier);

  let seasonId = 0;
  try {
    const season = await prisma.season.findFirst({ where: { isActive: true }, select: { id: true } });
    if (season) seasonId = season.id;
  } catch { /* table may not exist yet */ }

  try {
    await prisma.xpLedger.create({
      data: {
        userId,
        ruleId: `streak_milestone_${newStreak}`,
        xpDelta: xp,
        spDelta,
        seasonId,
        source: "streak",
        idempotencyKey,
        note: `Streak milestone: ${newStreak} days`,
      },
    });

    if (spDelta > 0 && seasonId > 0) {
      await prisma.seasonScore.upsert({
        where: { userId_seasonId: { userId, seasonId } },
        create: { userId, seasonId, spTotal: spDelta },
        update: { spTotal: { increment: spDelta } },
      });
    }
  } catch (e) {
    // P2002 = already awarded; any other DB error is swallowed to avoid breaking streak update.
  }
}

/**
 * Returns the current streak for a user, or null if no streak exists.
 */
export async function getStreak(prisma, userId, streakType) {
  const row = await prisma.userStreak.findUnique({
    where: { userId_streakType: { userId, streakType } },
  });
  return row ? { current: row.currentStreak, longest: row.longestStreak } : null;
}

// ---------------------------------------------------------------------------
// Period key helpers
// ---------------------------------------------------------------------------

function getDayKey(date) {
  return new Date(date).toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getPreviousDayKey(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getWeekKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function getPreviousWeekKey(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - 7);
  return getWeekKey(d);
}
