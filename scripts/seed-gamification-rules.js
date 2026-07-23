/**
 * Seed script — populates GamificationRule with the full spec config.
 * Run once after the Phase 11 migration:
 *
 *   node scripts/seed-gamification-rules.js
 *
 * Safe to re-run: uses upsert so existing rules are updated in place.
 */

import { PrismaClient } from "@prisma/client";
import { GAMIFICATION_RULES } from "../lib/gamification/rulesConfig.js";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${GAMIFICATION_RULES.length} gamification rules…`);

  let created = 0;
  let updated = 0;

  for (const rule of GAMIFICATION_RULES) {
    const { id, ...data } = rule;
    const result = await prisma.gamificationRule.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
    // Prisma upsert doesn't tell us which branch ran, so we track via createdAt proximity.
    const isNew = Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;
    if (isNew) created++; else updated++;
    console.log(`  [${isNew ? "created" : "updated"}] ${id}`);
  }

  console.log(`\nDone. ${created} created, ${updated} updated.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
