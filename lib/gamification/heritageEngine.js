/**
 * Heritage XP Engine — E2 spec §8 / §14.
 *
 * Awards XP on the first successful sync per platform per user based on the
 * total playtime imported. Formula (config-driven):
 *
 *   heritage_xp = min(heritage.cap, floor(totalHours × heritage.per_hour))
 *
 * Defaults: per_hour=1.5, cap=2500  → a 1,667-hour Steam veteran maxes out.
 * Heritage is XP-only (spDelta=0): it rewards past dedication without
 * distorting the seasonal SP leaderboard for active users.
 *
 * Idempotency: `heritage:<userId>:<provider>` in XpLedger.idempotencyKey —
 * subsequent syncs for the same platform never award heritage again.
 *
 * Bridge write: also inserts a PointsLedger row so the v1 profile page
 * reflects heritage XP until E3 cutover.
 */

import { getConfigs } from "./config.js";

/**
 * Award heritage XP for a first platform sync.
 *
 * @param {object} prisma
 * @param {string} userId
 * @param {string} provider  - e.g. "steam" | "psn" | "epic"
 * @param {number} totalHours - total playtime hours imported from this platform
 * @returns {{ xpAwarded: number, alreadyAwarded: boolean }}
 */
export async function awardHeritageXp(prisma, userId, provider, totalHours) {
  const idempotencyKey = `heritage:${userId}:${provider}`;

  // Check if already awarded (idempotency check before computing anything).
  const existing = await prisma.xpLedger.findUnique({
    where: { idempotencyKey },
    select: { xpDelta: true },
  }).catch(() => null); // table not yet migrated in some envs

  if (existing) {
    return { xpAwarded: existing.xpDelta, alreadyAwarded: true };
  }

  if (!totalHours || totalHours <= 0) {
    return { xpAwarded: 0, alreadyAwarded: false };
  }

  const cfg = await getConfigs(["heritage.per_hour", "heritage.cap"]);
  const perHour = Number(cfg["heritage.per_hour"] ?? 1.5);
  const cap = Number(cfg["heritage.cap"] ?? 2500);

  const xpAwarded = Math.min(cap, Math.floor(totalHours * perHour));

  if (xpAwarded <= 0) {
    return { xpAwarded: 0, alreadyAwarded: false };
  }

  // Active season (heritage always lands in current season as XP-only).
  const seasonId = await prisma.season
    .findFirst({ where: { isActive: true }, orderBy: { id: "desc" } })
    .then((s) => s?.id ?? 0)
    .catch(() => 0);

  // Write to XpLedger (v2.2 primary).
  try {
    await prisma.xpLedger.create({
      data: {
        userId,
        ruleId: null,
        xpDelta: xpAwarded,
        spDelta: 0, // XP-only — heritage does not award seasonal SP
        seasonId,
        source: "heritage",
        idempotencyKey,
        note: `Heritage XP: ${Math.round(totalHours)} h × ${perHour} = ${xpAwarded} XP (${provider}, cap ${cap})`,
      },
    });
  } catch (e) {
    if (e.code === "P2002") {
      // Race — another request already wrote it.
      return { xpAwarded: 0, alreadyAwarded: true };
    }
    // XpLedger table not yet migrated — log and fall through to v1 bridge only.
    console.warn("[heritageEngine] XpLedger write failed (pre-migration env?):", e.message);
  }

  // v1 bridge: also write to PointsLedger so profile page reflects heritage XP.
  // Uses "heritage_award" ruleId — ensure the seed creates this rule.
  try {
    await prisma.pointsLedger.create({
      data: {
        userId,
        ruleId: "heritage_award",
        points: xpAwarded,
        note: `Heritage XP from ${provider} (${Math.round(totalHours)} hours imported)`,
      },
    });
  } catch (e) {
    // Rule may not exist yet — non-fatal, v2 ledger is the source of truth.
    console.warn("[heritageEngine] PointsLedger bridge write failed:", e.message);
  }

  return { xpAwarded, alreadyAwarded: false };
}

/**
 * Check whether heritage XP has already been awarded for a given platform.
 * Cheap check — use before computing totalHours to skip unnecessary DB work.
 */
export async function hasHeritageXp(prisma, userId, provider) {
  try {
    const row = await prisma.xpLedger.findUnique({
      where: { idempotencyKey: `heritage:${userId}:${provider}` },
      select: { id: true },
    });
    return !!row;
  } catch {
    return false;
  }
}
