const TIERS = [
  { tier: "Diamond",  min: 50000, next: null  },
  { tier: "Platinum", min: 15000, next: 50000 },
  { tier: "Gold",     min: 5000,  next: 15000 },
  { tier: "Silver",   min: 1000,  next: 5000  },
  { tier: "Bronze",   min: 0,     next: 1000  },
];

export function computeL9Points({ playtimeHours = 0, achievementsUnlocked = 0 }) {
  return Math.round((playtimeHours ?? 0) * 10 + (achievementsUnlocked ?? 0) * 50);
}

export function computeLevel(l9Points) {
  return Math.floor(l9Points / 1000) + 1;
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
