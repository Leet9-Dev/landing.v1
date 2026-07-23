/**
 * Streak engine — manages consecutive login (daily) and play (weekly) streaks.
 *
 * Called by engine.js after user_login and game_hours_weekly events.
 * Streak breaks if the user misses a day (login) or a week (play).
 */

/**
 * Updates the streak for a given streakType.
 * Increments currentStreak on consecutive activity, resets to 1 on a gap.
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
  const newStreak = isConsecutive ? existing.currentStreak + 1 : 1;
  const longestStreak = Math.max(existing.longestStreak, newStreak);

  await prisma.userStreak.update({
    where: { userId_streakType: { userId, streakType } },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastActivityDate: now,
      streakStartedAt: isConsecutive ? existing.streakStartedAt : now,
    },
  });
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
