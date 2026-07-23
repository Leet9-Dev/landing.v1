/**
 * POST /api/me/gamification/events
 * Ingests a gamification event for the authenticated user.
 *
 * Body: { eventType, payload, idempotencyKey }
 *
 * Returns: { awarded: [{ ruleId, points }], badgesUnlocked: string[] }
 */

import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { processEvent } from "@/lib/gamification/engine";

const ALLOWED_EVENT_TYPES = [
  "user_login",
  "game_hours_daily",
  "game_hours_weekly",
  "social_connected",
  "achievement_unlocked",
  "achievement_shared",
  "game_added",
  "gaming_account_connected",
  "web3_wallet_connected",
];

export async function POST(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const body = await request.json().catch(() => ({}));
  const { eventType, payload = {}, idempotencyKey } = body;

  if (!eventType || !ALLOWED_EVENT_TYPES.includes(eventType)) {
    return apiError("INVALID_EVENT_TYPE", `eventType must be one of: ${ALLOWED_EVENT_TYPES.join(", ")}`, 400);
  }
  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return apiError("MISSING_IDEMPOTENCY_KEY", "idempotencyKey is required", 400);
  }

  const result = await processEvent(prisma, session.user.id, eventType, payload, idempotencyKey);

  return apiOk({
    awarded: result.awarded,
    badgesUnlocked: result.badgesUnlocked,
    alreadyProcessed: result.event === null,
  });
}
