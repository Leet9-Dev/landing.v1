import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/health
 *
 * E11 Launch Checklist — system readiness probe.
 * Verifies that all v2.2 migrations have been applied and seed data is present.
 * Returns { ready: boolean, checks: { [name]: { ok, detail } } }.
 */
export async function GET() {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const checks = {};

  // ── Migration checks (table existence) ──────────────────────────────────
  checks.xp_ledger = await probe("XpLedger table", () =>
    prisma.xpLedger.count({ take: 1 })
  );

  checks.daily_counter = await probe("DailyCounter table", () =>
    prisma.dailyCounter.count({ take: 1 })
  );

  checks.gamification_config = await probe("GamificationConfig table", () =>
    prisma.gamificationConfig.count({ take: 1 })
  );

  checks.level_curve = await probe("LevelCurve table", () =>
    prisma.levelCurve.count({ take: 1 })
  );

  checks.season = await probe("Season table", () =>
    prisma.season.count({ take: 1 })
  );

  checks.season_score = await probe("SeasonScore table", () =>
    prisma.seasonScore.count({ take: 1 })
  );

  // ── Seed data checks ────────────────────────────────────────────────────
  checks.active_season = await probe("Active season present", async () => {
    const s = await prisma.season.findFirst({ where: { isActive: true } });
    if (!s) throw new Error("No active season found — run seed");
    return `Season ${s.id}: ${s.name}`;
  });

  checks.config_seeded = await probe("GamificationConfig seeded", async () => {
    const count = await prisma.gamificationConfig.count();
    if (count < 10) throw new Error(`Only ${count} config rows — run seed`);
    return `${count} keys`;
  });

  checks.level_curve_seeded = await probe("LevelCurve seeded", async () => {
    const count = await prisma.levelCurve.count();
    if (count < 10) throw new Error(`Only ${count} levels — run seed`);
    return `${count} levels`;
  });

  checks.rules_seeded = await probe("GamificationRule seeded", async () => {
    const count = await prisma.gamificationRule.count({ where: { active: true } });
    if (count < 5) throw new Error(`Only ${count} active rules — run seed`);
    return `${count} active rules`;
  });

  // ── E4 Sprint columns ───────────────────────────────────────────────────
  checks.sprint_columns = await probe("GameChallenge sprint columns", async () => {
    // If the column doesn't exist, this select will throw.
    await prisma.gameChallenge.findFirst({ select: { sprintDuration: true, sprintStat: true, expiresAt: true } });
    return "ok";
  });

  // ── E5 Freeze token columns ─────────────────────────────────────────────
  checks.freeze_columns = await probe("UserStreak freeze columns", async () => {
    await prisma.userStreak.findFirst({ select: { freezeTokens: true, lastFreezeUsedAt: true } });
    return "ok";
  });

  const ready = Object.values(checks).every((c) => c.ok);

  return apiOk({ ready, checks });
}

async function probe(label, fn) {
  try {
    const detail = await fn();
    return { ok: true, detail: detail ?? "ok" };
  } catch (e) {
    return { ok: false, detail: e?.message ?? "unknown error" };
  }
}
