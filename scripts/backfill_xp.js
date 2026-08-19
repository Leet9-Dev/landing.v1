/**
 * T-006 — XP backfill CLI
 *
 * Copies all PointsLedger rows into XpLedger (source="migration").
 * Idempotent — re-running skips already-migrated rows.
 *
 * Usage:  node scripts/backfill_xp.js
 * Dry run: node scripts/backfill_xp.js --dry-run
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 200;

async function main() {
  console.log(`XP Backfill — ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  // Active season for all historical rows.
  const activeSeason = await prisma.season
    .findFirst({ where: { isActive: true }, orderBy: { id: "desc" } })
    .then((s) => s?.id ?? 0)
    .catch(() => 0);

  console.log(`Active season: ${activeSeason}`);

  const total = await prisma.pointsLedger.count();
  console.log(`Total PointsLedger rows: ${total}`);

  let cursor = undefined;
  let processed = 0;
  let skipped = 0;
  let batch = 0;

  while (true) {
    const rows = await prisma.pointsLedger.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, userId: true, ruleId: true, eventId: true, points: true, awardedAt: true, note: true },
    });

    if (rows.length === 0) break;
    batch++;

    for (const row of rows) {
      if (DRY_RUN) {
        processed++;
        continue;
      }
      try {
        await prisma.xpLedger.create({
          data: {
            userId: row.userId,
            ruleId: row.ruleId,
            eventId: row.eventId ?? undefined,
            xpDelta: row.points,
            spDelta: row.points,
            seasonId: activeSeason,
            source: "migration",
            idempotencyKey: `v2backfill:${row.id}`,
            awardedAt: row.awardedAt,
            note: row.note ?? "Backfilled from PointsLedger",
          },
        });
        processed++;
      } catch (e) {
        if (e.code === "P2002") { skipped++; }
        else throw e;
      }
    }

    cursor = rows[rows.length - 1].id;
    process.stdout.write(`\r  Batch ${batch}: ${processed + skipped}/${total} (${skipped} skipped)`);

    if (rows.length < BATCH_SIZE) break;
  }

  console.log(`\nDone. Processed: ${processed}  Skipped (already done): ${skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
