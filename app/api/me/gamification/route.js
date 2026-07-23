/**
 * GET /api/me/gamification
 * Returns the authenticated user's points balance, brand points, badges, and streaks.
 */

import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const [ledgerAgg, brandPoints, badges, streaks] = await Promise.all([
    // Total points balance (sum of all ledger entries).
    prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: { points: true },
    }),
    // Points per branded family.
    prisma.userBrandPoints.findMany({ where: { userId } }),
    // Unlocked badges.
    prisma.userBadge.findMany({ where: { userId }, orderBy: { unlockedAt: "asc" } }),
    // Streaks.
    prisma.userStreak.findMany({ where: { userId } }),
  ]);

  const totalPoints = ledgerAgg._sum.points ?? 0;

  // Group badges by branded name.
  const badgesByBrand = {};
  for (const b of badges) {
    if (!badgesByBrand[b.brandedName]) badgesByBrand[b.brandedName] = [];
    badgesByBrand[b.brandedName].push({ tier: b.tier, unlockedAt: b.unlockedAt });
  }

  const streakMap = {};
  for (const s of streaks) {
    streakMap[s.streakType] = { current: s.currentStreak, longest: s.longestStreak };
  }

  return apiOk({
    totalPoints,
    brandPoints: brandPoints.map((b) => ({ brandedName: b.brandedName, totalPoints: b.totalPoints })),
    badges: badgesByBrand,
    streaks: streakMap,
  });
}
