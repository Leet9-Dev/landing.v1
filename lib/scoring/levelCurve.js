/**
 * Level curve generator and utilities — v2.2 spec §8.
 *
 * step(L) = base + coef * (L - 1)^exp
 * cumulative(L) = sum of step(1..L)
 *
 * Default constants: base=300, coef=65, exp=1.5  →  L5 = 2300, L50 ≈ 462 890
 *
 * generateLevelCurve(prisma) regenerates the LevelCurve table from
 * GamificationConfig. Call at boot (or after config changes).
 *
 * levelOf(xp, curve?) and xpForLevel(level, curve?) are sync lookups;
 * they accept an optional pre-loaded curve array so callers can batch-load once.
 */

import { getConfigs } from "@/lib/gamification/config";
import { prisma as defaultPrisma } from "@/lib/prisma";

/** Build the curve array from config values (no DB reads/writes).
 *  stepXp is rounded to nearest 10 to match the econ_sim calibration. */
export function buildCurve({ base = 300, coef = 65, exp = 1.5, maxLevel = 100 } = {}) {
  const curve = []; // index 0 = level 1
  for (let L = 1; L <= maxLevel; L++) {
    const raw = base + coef * Math.pow(L - 1, exp);
    const stepXp = Math.round(raw / 10) * 10;
    const prevCumulative = curve.length > 0 ? curve[curve.length - 1].cumulativeXp : 0;
    curve.push({ level: L, stepXp, cumulativeXp: prevCumulative + stepXp });
  }
  return curve;
}

/**
 * Regenerate the LevelCurve table from current GamificationConfig.
 * Uses TRUNCATE + INSERT for idempotency (safe to call repeatedly at boot).
 */
export async function generateLevelCurve(prisma = defaultPrisma) {
  const cfg = await getConfigs([
    "level.step.base",
    "level.step.coef",
    "level.step.exp",
    "level.max",
  ]);

  const base     = Number(cfg["level.step.base"] ?? 300);
  const coef     = Number(cfg["level.step.coef"] ?? 65);
  const exp      = Number(cfg["level.step.exp"]  ?? 1.5);
  const maxLevel = Number(cfg["level.max"]        ?? 100);

  const curve = buildCurve({ base, coef, exp, maxLevel });

  await prisma.$transaction([
    prisma.levelCurve.deleteMany(),
    prisma.levelCurve.createMany({ data: curve }),
  ]);

  return curve;
}

/**
 * Load curve from DB. Falls back to in-memory build if table is empty.
 * Cached in module scope for the process lifetime (invalidated at cold start).
 */
let _curveCache = null;

export async function loadCurve(prisma = defaultPrisma) {
  if (_curveCache) return _curveCache;
  const rows = await prisma.levelCurve.findMany({ orderBy: { level: "asc" } });
  if (rows.length > 0) {
    _curveCache = rows;
    return rows;
  }
  // Table empty — build in-memory from defaults
  _curveCache = buildCurve();
  return _curveCache;
}

export function invalidateCurveCache() {
  _curveCache = null;
}

/** Return the level (1-based) for a given lifetime XP total. Sync. */
export function levelOf(xp, curve) {
  if (!curve || curve.length === 0) {
    // Fallback: build default curve synchronously
    curve = buildCurve();
  }
  let level = 1;
  for (const row of curve) {
    if (xp >= row.cumulativeXp) {
      level = row.level;
    } else {
      break;
    }
  }
  return level;
}

/** Return cumulative XP threshold for a given level. Sync. */
export function xpForLevel(level, curve) {
  if (!curve || curve.length === 0) curve = buildCurve();
  const row = curve.find((r) => r.level === level);
  return row ? row.cumulativeXp : Infinity;
}

/** Async version of levelOf — loads curve from DB if not provided. */
export async function levelOfAsync(xp, prisma = defaultPrisma) {
  const curve = await loadCurve(prisma);
  return levelOf(xp, curve);
}
