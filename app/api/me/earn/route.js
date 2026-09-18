import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { GAMIFICATION_RULES } from "@/lib/gamification/rulesConfig";

// Build badge tier thresholds from static config.
// Returns { [brandedName]: [{ tier, points }, ...] } sorted asc by points.
function buildBadgeThresholds() {
  const map = {};
  for (const rule of GAMIFICATION_RULES) {
    if (!rule.brandedName || !rule.badgeCollectionPoints) continue;
    if (!map[rule.brandedName]) map[rule.brandedName] = [];
    if (!map[rule.brandedName].find((t) => t.tier === rule.badgeTier)) {
      map[rule.brandedName].push({ tier: rule.badgeTier, points: rule.badgeCollectionPoints });
    }
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => a.points - b.points);
  }
  return map;
}

// Build a map of family metadata from static rules config.
// Returns { [brandedName]: { label, description, actions: [...] } }
function buildFamilyMeta() {
  const FAMILY_LABELS = {
    "Overachiever":    { label: "Login Streaks",       description: "Log in every day to build your streak and earn bonus XP." },
    "Relentless":      { label: "Daily Play Time",     description: "Rack up hours across your gaming platforms each day and week." },
    "Public Figure":   { label: "Social Accounts",     description: "Connect your social media accounts to boost your reach." },
    "Versatile Gamer": { label: "Gaming Accounts",     description: "Connect more gaming platforms — the more, the better." },
    "Blockchainer":    { label: "Web3 Wallets",        description: "Link your Web3 wallets to unlock blockchain achievements." },
    "Game Sommelier":  { label: "Game Library",        description: "Grow your game library — every title counts." },
    "Persona":         { label: "Profile Setup",       description: "Complete your profile to stand out from the crowd." },
    "Ambassador":      { label: "Referrals",           description: "Invite friends and earn XP when they join and play." },
    "Social Star":     { label: "Social Graph",        description: "Build your network — follow players and get followers." },
    "Curator":         { label: "Content Creation",    description: "Write reviews and build game lists to earn Curator XP." },
    "Hardcore":        { label: "Game Mastery",        description: "Dominate a single game — hours in and 100% completions." },
    "OG":              { label: "Veteran Milestones",  description: "Keep showing up. Longevity is its own reward." },
    "Most Wanted":     { label: "Share Achievements",  description: "Share your achievements to prove you're the real deal." },
  };

  const map = {};
  for (const rule of GAMIFICATION_RULES) {
    if (!rule.brandedName) continue;
    if (!map[rule.brandedName]) {
      map[rule.brandedName] = {
        ...(FAMILY_LABELS[rule.brandedName] || { label: rule.brandedName, description: "" }),
        actions: [],
      };
    }
    map[rule.brandedName].actions.push({
      id: rule.id,
      label: rule.label,
      description: rule.description,
      points: rule.points,
      active: rule.active,
      looped: rule.looped,
      loopFrequency: rule.loopFrequency ?? null,
    });
  }
  return map;
}

const BADGE_THRESHOLDS = buildBadgeThresholds();
const FAMILY_META = buildFamilyMeta();

function computeFamilyProgress(brandedName, earnedPoints, unlockedTiers) {
  const thresholds = BADGE_THRESHOLDS[brandedName] ?? [];
  if (thresholds.length === 0) return null; // no badge for this family

  const unlockedSet = new Set(unlockedTiers);
  const currentTier = [...thresholds].reverse().find((t) => unlockedSet.has(t.tier))?.tier ?? null;
  const currentThreshold = thresholds.find((t) => t.tier === currentTier)?.points ?? 0;
  const nextThresholdObj = thresholds.find((t) => !unlockedSet.has(t.tier));

  if (!nextThresholdObj) {
    // All tiers unlocked
    return { currentTier: "gold", nextTier: null, xpToNext: 0, progressPct: 100, earnedPoints };
  }

  const xpToNext = Math.max(0, nextThresholdObj.points - earnedPoints);
  const range = nextThresholdObj.points - currentThreshold;
  const progressInRange = earnedPoints - currentThreshold;
  const progressPct = range > 0 ? Math.min(100, Math.round((progressInRange / range) * 100)) : 0;

  return {
    currentTier,
    nextTier: nextThresholdObj.tier,
    nextTierPoints: nextThresholdObj.points,
    xpToNext,
    progressPct,
    earnedPoints,
  };
}

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const [brandPointsRows, badgeRows] = await Promise.all([
    prisma.userBrandPoints.findMany({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId }, select: { brandedName: true, tier: true } }),
  ]);

  // Index by brandedName
  const earnedByFamily = {};
  for (const row of brandPointsRows) {
    earnedByFamily[row.brandedName] = row.totalPoints;
  }

  const unlockedByFamily = {};
  for (const row of badgeRows) {
    if (!unlockedByFamily[row.brandedName]) unlockedByFamily[row.brandedName] = [];
    unlockedByFamily[row.brandedName].push(row.tier);
  }

  // Build full family list
  const families = Object.entries(FAMILY_META).map(([brandedName, meta]) => {
    const earned = earnedByFamily[brandedName] ?? 0;
    const unlocked = unlockedByFamily[brandedName] ?? [];
    const progress = computeFamilyProgress(brandedName, earned, unlocked);

    return {
      brandedName,
      label: meta.label,
      description: meta.description,
      actions: meta.actions,
      hasBadge: !!BADGE_THRESHOLDS[brandedName],
      progress: progress ?? null,
    };
  });

  // Next rewards — only families with badges and a next tier to unlock
  const withNextTier = families.filter((f) => f.progress && f.progress.nextTier);

  const byClosest = [...withNextTier]
    .sort((a, b) => b.progress.progressPct - a.progress.progressPct)
    .slice(0, 3);

  const byHighestXp = [...withNextTier]
    .sort((a, b) => {
      // Highest XP reward for the next tier
      const aThresholds = BADGE_THRESHOLDS[a.brandedName] ?? [];
      const bThresholds = BADGE_THRESHOLDS[b.brandedName] ?? [];
      const aNext = aThresholds.find((t) => t.tier === a.progress.nextTier)?.points ?? 0;
      const bNext = bThresholds.find((t) => t.tier === b.progress.nextTier)?.points ?? 0;
      return bNext - aNext;
    })
    .slice(0, 3);

  return apiOk({ families, nextRewards: { closest: byClosest, highestXp: byHighestXp } });
}
