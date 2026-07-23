/**
 * ONE-TIME seed route — Phase 12 update.
 * Updates all existing rules with label/description, adds 17 new rules.
 * DELETE THIS FILE after running once in production.
 *
 * Usage: GET /api/internal/seed-gamification?secret=gami-seed-7xK9mP2qR4vL
 */

import { prisma } from "@/lib/prisma";
import { GAMIFICATION_RULES } from "@/lib/gamification/rulesConfig";

const SEED_SECRET = "gami-seed-7xK9mP2qR4vL";

export async function GET(request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (secret !== SEED_SECRET) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let created = 0;
  let updated = 0;

  for (const rule of GAMIFICATION_RULES) {
    const { id, ...data } = rule;
    const before = await prisma.gamificationRule.findUnique({ where: { id } });
    await prisma.gamificationRule.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
    if (before) updated++; else created++;
  }

  return Response.json({
    ok: true,
    message: `Seeded ${GAMIFICATION_RULES.length} rules. ${created} created, ${updated} updated.`,
    created,
    updated,
  });
}
