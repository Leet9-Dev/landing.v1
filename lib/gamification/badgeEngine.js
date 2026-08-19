/**
 * Badge engine — checks whether a user has crossed a badge tier threshold
 * for a given branded name family, and permanently unlocks it if so.
 *
 * E6 v2: primary source is XpLedger (sum by brandedName rules);
 * falls back to UserBrandPoints for users with no v2 XP yet.
 *
 * Called by engine.js after every points award.
 */

const TIER_ORDER = ["bronze", "silver", "gold"];

/**
 * Resolves total XP earned in a brandedName family from XpLedger (v2),
 * falling back to UserBrandPoints.totalPoints (v1) when no v2 data exists.
 */
async function brandXpTotal(prisma, userId, brandedName) {
  // v2: sum XpLedger for all rules in this brand family.
  const brandRules = await prisma.gamificationRule.findMany({
    where: { brandedName },
    select: { id: true },
  }).catch(() => []);

  if (brandRules.length > 0) {
    const ruleIds = brandRules.map((r) => r.id);
    const agg = await prisma.xpLedger.aggregate({
      where: { userId, ruleId: { in: ruleIds } },
      _sum: { xpDelta: true },
    }).catch(() => ({ _sum: { xpDelta: 0 } }));

    const v2Total = agg._sum.xpDelta ?? 0;
    if (v2Total > 0) return v2Total;
  }

  // v1 fallback: UserBrandPoints.
  const brandRow = await prisma.userBrandPoints.findUnique({
    where: { userId_brandedName: { userId, brandedName } },
  }).catch(() => null);

  return brandRow?.totalPoints ?? 0;
}

/**
 * Checks all tier thresholds for a brandedName and unlocks any newly earned tiers.
 *
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {string} userId
 * @param {string} brandedName
 * @returns {string[]} list of newly unlocked tier strings e.g. ["bronze"]
 */
export async function checkAndUnlockBadges(prisma, userId, brandedName) {
  // All active rules for this brandedName that have a badge tier and threshold.
  const tierRules = await prisma.gamificationRule.findMany({
    where: {
      brandedName,
      badgeTier: { in: TIER_ORDER },
      badgeCollectionPoints: { not: null },
      badgeActive: true,
    },
  });

  if (tierRules.length === 0) return [];

  const totalXp = await brandXpTotal(prisma, userId, brandedName);
  if (totalXp === 0) return [];

  // Already-unlocked tiers for this user + brand.
  const existingBadges = await prisma.userBadge.findMany({
    where: { userId, brandedName },
    select: { tier: true },
  });
  const alreadyUnlocked = new Set(existingBadges.map((b) => b.tier));

  const newlyUnlocked = [];

  for (const rule of tierRules) {
    const tier = rule.badgeTier;
    if (alreadyUnlocked.has(tier)) continue;
    if (!rule.badgeCollectionPoints) continue;
    if (totalXp >= rule.badgeCollectionPoints) {
      await prisma.userBadge.create({
        data: {
          userId,
          brandedName,
          tier,
          pointsSnapshot: totalXp,
        },
      });
      newlyUnlocked.push(tier);
    }
  }

  return newlyUnlocked;
}

/**
 * Returns all badges for a user, grouped by brandedName.
 */
export async function getUserBadges(prisma, userId) {
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { unlockedAt: "asc" },
  });

  const grouped = {};
  for (const badge of badges) {
    if (!grouped[badge.brandedName]) grouped[badge.brandedName] = [];
    grouped[badge.brandedName].push({ tier: badge.tier, unlockedAt: badge.unlockedAt });
  }
  return grouped;
}

/**
 * Returns the current badge tier for a user in a given branded family.
 * Returns the highest unlocked tier, or null if none.
 */
export function highestTier(tiers) {
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    if (tiers.includes(TIER_ORDER[i])) return TIER_ORDER[i];
  }
  return null;
}
