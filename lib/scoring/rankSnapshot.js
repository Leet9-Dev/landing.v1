/**
 * Captures a user's current L9 Points total and global rank position.
 * Used by sync-execute routes to snapshot rank before and after a sync,
 * enabling the share card delta calculation.
 */

export async function captureRankSnapshot(prisma, userId) {
  const [xpRow, ledgerRow] = await Promise.all([
    prisma.xpLedger
      .aggregate({ where: { userId }, _sum: { xpDelta: true } })
      .catch(() => null),
    prisma.pointsLedger
      .aggregate({ where: { userId }, _sum: { points: true } })
      .catch(() => null),
  ]);

  const xp = xpRow?._sum?.xpDelta ?? 0;
  const v1 = ledgerRow?._sum?.points ?? 0;
  const l9Points = xp > 0 ? xp : v1;

  // Global rank = number of users with strictly more points than this user + 1.
  const higherCount = await prisma.xpLedger
    .groupBy({ by: ["userId"], _sum: { xpDelta: true }, having: { xpDelta: { _sum: { gt: l9Points } } } })
    .then((rows) => rows.length)
    .catch(() => 0);

  return { l9Points, rank: higherCount + 1 };
}
