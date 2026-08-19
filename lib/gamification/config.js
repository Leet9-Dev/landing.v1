/**
 * GamificationConfig service — typed reads/writes backed by the DB table.
 *
 * All §19 keys are defined in DEFAULTS below (string-encoded JSON values).
 * At runtime, the DB is the source of truth; DEFAULTS serve as the in-process
 * fallback when the DB hasn't been seeded yet (local dev / tests).
 *
 * Hot-reload: call invalidateConfigCache() after a PUT /admin/config to ensure
 * the next read picks up the new values. Cache TTL is 60 s in production.
 */

import { prisma } from "@/lib/prisma";

// §19 defaults — all values JSON-encoded strings.
export const CONFIG_DEFAULTS = {
  // Level curve
  "level.step.base": "300",
  "level.step.coef": "65",
  "level.step.exp": "1.5",
  "level.max": "100",

  // Tier thresholds (XP)
  "tier.bronze": "0",
  "tier.silver": "1000",
  "tier.gold": "3500",
  "tier.platinum": "5250",
  "tier.diamond": "15000",

  // Daily caps (SP)
  "cap.play_hours.daily": "3",        // max SP-eligible play hours per day
  "cap.share.daily": "1",             // max share events per day

  // Heritage rule (E2)
  "heritage.per_hour": "1.5",
  "heritage.cap": "2500",

  // XP award amounts (mirrored from seed rules, kept here for engine reads)
  "xp.login_daily": "20",
  "xp.play_hour": "30",
  "xp.achievement": "50",
  "xp.share_daily": "25",
  "xp.game_added": "10",
  "xp.connect_gaming": "150",
  "xp.connect_social": "100",
  "xp.follow_first": "50",
  "xp.friend_activated": "200",

  // SP multiplier (seasonal points = xp * multiplier, can be 0 for XP-only events)
  "sp.multiplier": "1",

  // Economy invariants (informational — not enforced by engine, validated by econ_sim)
  "invariant.play_family_min_pct": "60",
  "invariant.login_max_pct": "15",
  "invariant.social_max_pct": "10",
};

let _cache = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 60_000;

export function invalidateConfigCache() {
  _cache = null;
  _cacheExpiry = 0;
}

async function loadConfig() {
  const now = Date.now();
  if (_cache && now < _cacheExpiry) return _cache;

  try {
    const rows = await prisma.gamificationConfig.findMany();
    const map = { ...CONFIG_DEFAULTS };
    for (const row of rows) {
      map[row.key] = row.value;
    }
    _cache = map;
    _cacheExpiry = now + CACHE_TTL_MS;
    return map;
  } catch {
    // DB not yet migrated (local dev before migration) — fall back to defaults.
    return CONFIG_DEFAULTS;
  }
}

/** Read a config value, parsed from JSON. Returns undefined if key is unknown. */
export async function getConfig(key) {
  const map = await loadConfig();
  const raw = map[key];
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Read multiple keys at once. Returns { [key]: parsedValue }. */
export async function getConfigs(keys) {
  const map = await loadConfig();
  const out = {};
  for (const key of keys) {
    const raw = map[key];
    if (raw === undefined) continue;
    try {
      out[key] = JSON.parse(raw);
    } catch {
      out[key] = raw;
    }
  }
  return out;
}

/** Write a config value (admin only). Value is JSON.stringify'd before storage. */
export async function setConfig(key, value, updatedBy = null) {
  const encoded = typeof value === "string" ? value : JSON.stringify(value);
  await prisma.gamificationConfig.upsert({
    where: { key },
    create: { key, value: encoded, updatedBy },
    update: { value: encoded, updatedBy },
  });
  invalidateConfigCache();
}

/** Return the full config map with parsed values (for admin UI). */
export async function getAllConfigs() {
  const map = await loadConfig();
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    try {
      out[k] = JSON.parse(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}
