import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

/**
 * T-006 — XP backfill: copies all existing PointsLedger rows into XpLedger
 * so users who earned points before E1 have their XP history in the v2.2 system.
 *
 * Idempotency: uses `v2backfill:<ledgerId>` as XpLedger.idempotencyKey.
 * Safe to call multiple times — already-migrated rows are skipped (P2002).
 *
 * Runs in batches of 100 to avoid long-running serverless timeouts.
 * Pass ?cursor=<lastId> to continue from a previous run.
 *
 * POST /api/admin/backfill-xp
 * POST /api/admin/backfill-xp?cursor=<lastProcessedLedgerId>
 *
 * Returns: { processed, skipped, nextCursor } — call again with nextCursor
 * until nextCursor is null to complete the full backfill.
 */

const BATCH_SIZE = 100;

async function requireAdmin() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return { error: unauthenticated };
  return { session };
}

export async function POST(request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;

  // Fetch a batch of PointsLedger rows ordered by id (stable cursor pagination).
  const ledgerRows = await prisma.pointsLedger.findMany({
    take: BATCH_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { id: "asc" },
    select: { id: true, userId: true, ruleId: true, eventId: true, points: true, awardedAt: true, note: true },
  });

  if (ledgerRows.length === 0) {
    return apiOk({ processed: 0, skipped: 0, nextCursor: null, done: true });
  }

  // Get active season (Preseason = 0 for all historical rows).
  const activeSeason = await prisma.season
    .findFirst({ where: { isActive: true }, orderBy: { id: "desc" } })
    .then((s) => s?.id ?? 0)
    .catch(() => 0);

  let processed = 0;
  let skipped = 0;

  for (const row of ledgerRows) {
    try {
      await prisma.xpLedger.create({
        data: {
          userId: row.userId,
          ruleId: row.ruleId,
          eventId: row.eventId ?? undefined,
          xpDelta: row.points,
          spDelta: row.points, // 1:1 for historical data (Preseason)
          seasonId: activeSeason,
          source: "migration",
          idempotencyKey: `v2backfill:${row.id}`,
          awardedAt: row.awardedAt,
          note: row.note ?? "Backfilled from PointsLedger",
        },
      });
      processed++;
    } catch (e) {
      if (e.code === "P2002") {
        skipped++; // already backfilled
      } else {
        throw e;
      }
    }
  }

  const nextCursor = ledgerRows.length === BATCH_SIZE ? ledgerRows[ledgerRows.length - 1].id : null;

  return apiOk({ processed, skipped, nextCursor, done: nextCursor === null });
}
