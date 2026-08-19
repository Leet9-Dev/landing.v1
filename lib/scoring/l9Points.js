// v2.2 tier thresholds — lifetime XP (matches GamificationConfig tier.* keys and §19).
const TIERS = [
  { tier: "Diamond",  min: 15000, next: null  },
  { tier: "Platinum", min: 5250,  next: 15000 },
  { tier: "Gold",     min: 3500,  next: 5250  },
  { tier: "Silver",   min: 1000,  next: 3500  },
  { tier: "Bronze",   min: 0,     next: 1000  },
];

export function computeL9Points({ playtimeHours = 0, achievementsUnlocked = 0 }) {
  return Math.round((playtimeHours ?? 0) * 10 + (achievementsUnlocked ?? 0) * 50);
}

// Legacy level formula — kept for v1 API compatibility until E3 callers migrate.
export function computeLevel(l9Points) {
  return Math.floor(l9Points / 1000) + 1;
}

// v2.2 level from XP using pre-loaded curve array (sync, no DB call).
// Pass curve from loadCurve() or buildCurve() in levelCurve.js.
export function computeLevelFromXp(lifetimeXp, curve) {
  if (!curve || curve.length === 0) return 1;
  let level = 1;
  for (const row of curve) {
    if (lifetimeXp >= row.cumulativeXp) level = row.level;
    else break;
  }
  return level;
}

export function computeRankInfo(l9Points) {
  const current = TIERS.find((t) => l9Points >= t.min) ?? TIERS[TIERS.length - 1];
  const nextTier = current.next != null ? TIERS.find((t) => t.min === current.next) : null;

  if (!current.next) {
    return {
      rankTier: current.tier,
      nextRank: null,
      rankProgressPct: 100,
      pointsToNextRank: 0,
    };
  }

  const rangeSize = current.next - current.min;
  const posInRange = l9Points - current.min;
  const rankProgressPct = Math.min(100, Math.round((posInRange / rangeSize) * 100));

  return {
    rankTier: current.tier,
    nextRank: nextTier?.tier ?? null,
    rankProgressPct,
    pointsToNextRank: current.next - l9Points,
  };
}
