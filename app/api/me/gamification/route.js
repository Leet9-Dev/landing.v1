/**
 * GET /api/me/gamification
 * Returns the authenticated user's points balance, brand points, badges,
 * streaks, and a recent-awards feed with per-award explanations.
 */

import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const [ledgerAgg, recentLedger, brandPoints, badges, streaks] = await Promise.all([
    prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: { points: true },
    }),
    // Last 20 awards — each includes the "why" explanation in the note field.
    prisma.pointsLedger.findMany({
      where: { userId },
      orderBy: { awardedAt: "desc" },
      take: 20,
      select: {
        id: true,
        points: true,
        note: true,
        awardedAt: true,
        rule: { select: { label: true, objective: true } },
      },
    }),
    prisma.userBrandPoints.findMany({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId }, orderBy: { unlockedAt: "asc" } }),
    prisma.userStreak.findMany({ where: { userId } }),
  ]);

  const totalPoints = ledgerAgg._sum.points ?? 0;

  const recentAwards = recentLedger.map((entry) => ({
    id: entry.id,
    points: entry.points,
    label: entry.rule?.label ?? entry.rule?.objective ?? null,
    reason: entry.note,
    awardedAt: entry.awardedAt,
  }));

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
    recentAwards,
    brandPoints: brandPoints.map((b) => ({ brandedName: b.brandedName, totalPoints: b.totalPoints })),
    badges: badgesByBrand,
    streaks: streakMap,
  });
}
