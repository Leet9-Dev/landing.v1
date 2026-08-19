import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { getAllConfigs, setConfig, invalidateConfigCache } from "@/lib/gamification/config";
import { invalidateCurveCache } from "@/lib/scoring/levelCurve";

// Simple admin guard — must be authenticated. Extend to role check when roles land.
async function requireAdmin() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return { error: unauthenticated };
  return { session };
}

/** GET /api/admin/config — return all config keys with parsed values */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const configs = await getAllConfigs();
  return apiOk({ configs });
}

/** PUT /api/admin/config — update one or more config keys
 *  Body: { "level.step.base": 300, "tier.diamond": 15000, … }
 */
export async function PUT(request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError("INVALID_BODY", "Body must be a JSON object of { key: value }.", 400);
  }

  const updated = [];
  for (const [key, value] of Object.entries(body)) {
    if (typeof key !== "string" || key.length === 0) continue;
    await setConfig(key, value, session.user.id);
    updated.push(key);
  }

  if (updated.length === 0) {
    return apiError("NO_CHANGES", "No valid keys provided.", 400);
  }

  // If level curve keys changed, invalidate curve cache so next boot regenerates.
  if (updated.some((k) => k.startsWith("level."))) {
    invalidateCurveCache();
  }

  return apiOk({ updated });
}
