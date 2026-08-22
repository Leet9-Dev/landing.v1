/**
 * Gamification Engine v2.2 (T-004)
 *
 * Writes to XpLedger (dual-currency XP+SP) and enforces DailyCounter caps.
 * Runs alongside the v1 engine during the bridge period; v1 continues writing
 * PointsLedger so the profile page keeps working until E3 cutover.
 *
 * Entry point: processEventV2(prisma, userId, eventType, payload, idempotencyKey)
 *
 * Key differences from v1 engine:
 *   - Idempotency via XpLedger.idempotencyKey UNIQUE (P2002 = already processed)
 *   - DailyCounter cap enforcement before each award
 *   - SP = xpDelta * sp.multiplier (from GamificationConfig, default 1)
 *   - No UserBrandPoints / badge checks here — v1 handles those (shared DB state)
 *   - No GamificationEvent write — v1 engine owns that table
 *   - Reads active Season from Season table (defaults to id=0 Preseason)
 */

import { getConfigs } from "./config.js";

// Keys read from GamificationConfig on every processEventV2 call (cached).
const CONFIG_KEYS = ["sp.multiplier", "cap.play_hours.daily", "cap.share.daily"];

// Map from eventType to the DailyCounter key it increments (null = uncapped).
const DAILY_CAP_KEY = {
  game_hours_daily: "play_hours",
  play_hour_verified: "play_hours",   // canonical v2.2 name
  achievement_shared: "share",
  share_verified: "share",            // canonical v2.2 name
};

/**
 * Main v2.2 entry point.
 *
 * @param {object} prisma - Prisma client
 * @param {string} userId
 * @param {string} eventType
 * @param {object} payload  - same shape as v1 emitters pass
 * @param {string} idempotencyKey - unique key for this specific user+event occurrence
 * @returns {{ xpAwarded: number, spAwarded: number, entries: Array, skipped: boolean }}
 */
export async function processEventV2(prisma, userId, eventType, payload, idempotencyKey, awardedRuleIds = null) {
  // Load config + active season in parallel.
  const [cfg, activeSeason] = await Promise.all([
    getConfigs(CONFIG_KEYS),
    getActiveSeason(prisma),
  ]);

  const spMultiplier = Number(cfg["sp.multiplier"] ?? 1);

  // Load active rules for this eventType.
  const rules = await prisma.gamificationRule.findMany({
    where: { eventType, active: true },
  });

  if (rules.length === 0) return { xpAwarded: 0, spAwarded: 0, entries: [], skipped: false };

  // Daily counter for capped event types.
  const today = new Date().toISOString().slice(0, 10);
  const capKey = DAILY_CAP_KEY[eventType] ?? null;
  let dailyCount = 0;
  let dailyCap = Infinity;

  if (capKey) {
    dailyCap = Number(cfg[`cap.${capKey}.daily`] ?? Infinity);
    const counter = await prisma.dailyCounter.findUnique({
      where: { userId_date_counterKey: { userId, date: today, counterKey: capKey } },
    });
    dailyCount = counter?.count ?? 0;
  }

  let xpAwarded = 0;
  let spAwarded = 0;
  const entries = [];

  // If called from v1 with specific awarded rule IDs, filter to only those rules and skip
  // re-checking eligibility (v1 already validated it and modified UserRuleState before calling us).
  const filteredRules = awardedRuleIds !== null
    ? rules.filter((r) => awardedRuleIds.includes(r.id))
    : rules;

  for (const rule of filteredRules) {
    if (rule.points == null || rule.points <= 0) continue;

    // Eligibility: skip when v1 already confirmed it (awardedRuleIds provided).
    if (awardedRuleIds === null) {
      const eligible = await isEligibleV2(prisma, userId, rule, payload);
      if (!eligible) continue;
    }

    // DailyCounter cap check.
    if (capKey && dailyCount >= dailyCap) break; // cap exhausted for today

    const xpDelta = rule.points;
    const spDelta = Math.round(xpDelta * spMultiplier);
    const entryKey = `v2:${rule.id}:${idempotencyKey}`;

    try {
      await prisma.xpLedger.create({
        data: {
          userId,
          ruleId: rule.id,
          xpDelta,
          spDelta,
          seasonId: activeSeason,
          source: "rule",
          idempotencyKey: entryKey,
          note: rule.description,
        },
      });
    } catch (e) {
      if (e.code === "P2002") continue; // already awarded — skip
      throw e;
    }

    // Increment DailyCounter atomically.
    if (capKey) {
      await prisma.dailyCounter.upsert({
        where: { userId_date_counterKey: { userId, date: today, counterKey: capKey } },
        create: { userId, date: today, counterKey: capKey, count: 1 },
        update: { count: { increment: 1 } },
      });
      dailyCount++;
    }

    // Upsert SeasonScore (+spDelta) — create row if first season event.
    if (spDelta > 0) {
      await prisma.seasonScore.upsert({
        where: { userId_seasonId: { userId, seasonId: activeSeason } },
        create: { userId, seasonId: activeSeason, spTotal: spDelta },
        update: { spTotal: { increment: spDelta } },
      });
    }

    xpAwarded += xpDelta;
    spAwarded += spDelta;
    entries.push({ ruleId: rule.id, xpDelta, spDelta });
  }

  return { xpAwarded, spAwarded, entries, skipped: false };
}

// ---------------------------------------------------------------------------
// Eligibility (mirrors v1 isEligible — kept in sync manually until E3 cutover)
// ---------------------------------------------------------------------------

const LOOPFREQUENCY_MS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

async function isEligibleV2(prisma, userId, rule, payload) {
  const state = await prisma.userRuleState.findUnique({
    where: { userId_ruleId: { userId, ruleId: rule.id } },
  });

  if (!rule.looped && state?.milestoneReached) return false;

  const now = new Date();
  if (rule.startsAt && now < new Date(rule.startsAt)) return false;
  if (rule.endsAt && now > new Date(rule.endsAt)) return false;

  if (rule.metadata?.field != null) {
    if (payload.field !== rule.metadata.field) return false;
  }

  if (rule.thresholdCount != null) {
    const count = getPayloadCount(rule, payload);
    if (count == null || count < rule.thresholdCount) return false;
  }

  if (rule.metadata?.provider != null) {
    if (payload.provider !== rule.metadata.provider) return false;
  }

  if (rule.metadata?.requiredHours != null) {
    const hours = payload.hoursToday ?? payload.hoursThisWeek ?? payload.totalHoursInGame ?? 0;
    if (hours < rule.metadata.requiredHours) return false;
  }

  if (rule.looped && rule.loopFrequency && state?.lastFiredAt) {
    const elapsed = Date.now() - new Date(state.lastFiredAt).getTime();
    const required = LOOPFREQUENCY_MS[rule.loopFrequency] ?? 0;
    if (elapsed < required) return false;
  }

  if (rule.yearlyMaxPoints != null && state) {
    const thisYear = new Date().getFullYear();
    const stateYear = state.yearResetAt ? new Date(state.yearResetAt).getFullYear() : null;
    const pointsThisYear = stateYear === thisYear ? state.pointsThisYear : 0;
    if (pointsThisYear + (rule.points ?? 0) > rule.yearlyMaxPoints) return false;
  }

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

function getPayloadCount(rule, payload) {
  switch (rule.eventType) {
    case "user_login":                return payload.streakDays ?? null;
    case "social_connected":          return payload.totalSocials ?? null;
    case "gaming_account_connected":
    case "platform_connected":        return payload.totalAccounts ?? null;
    case "achievement_unlocked":      return payload.totalAchievements ?? null;
    case "achievement_shared":        return payload.totalShared ?? null;
    case "game_added":                return payload.totalGames ?? null;
    case "user_followed":             return payload.totalFollowing ?? null;
    case "friend_activated":          return payload.totalActivated ?? null;
    case "veteran_milestone":         return payload.totalLoginDays ?? null;
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// Active season lookup (cached per process restart)
// ---------------------------------------------------------------------------

let _activeSeasonId = null;

async function getActiveSeason(prisma) {
  if (_activeSeasonId !== null) return _activeSeasonId;
  try {
    const season = await prisma.season.findFirst({ where: { isActive: true }, orderBy: { id: "desc" } });
    _activeSeasonId = season?.id ?? 0;
  } catch {
    _activeSeasonId = 0; // DB not yet migrated
  }
  return _activeSeasonId;
}

export function invalidateSeasonCache() {
  _activeSeasonId = null;
}
