/**
 * Sprint Challenge Engine — E4 spec §11.
 *
 * Awards XP to the winner (and a smaller consolation XP to the loser) when a
 * sprint challenge resolves. Writes to XpLedger (v2.2 primary) and
 * PointsLedger (v1 bridge).
 *
 * Sprint XP schedule (config-driven via GamificationConfig):
 *   Winner:  sprint.xp.winner  (default 150 XP)
 *   Loser:   sprint.xp.loser   (default 30 XP — participation reward)
 *   Draw:    sprint.xp.draw    (default 75 XP each)
 *
 * SP = XP × sp.multiplier (from config, default 1).
 */

import { getConfigs } from "./config.js";

const SPRINT_DURATION_MS = {
  "24h": 24 * 60 * 60 * 1000,
  "72h": 72 * 60 * 60 * 1000,
  "7d":  7  * 24 * 60 * 60 * 1000,
};

/**
 * Compute the expiry timestamp from acceptance time and duration string.
 */
export function computeExpiresAt(acceptedAt, sprintDuration) {
  const ms = SPRINT_DURATION_MS[sprintDuration] ?? SPRINT_DURATION_MS["72h"];
  return new Date(new Date(acceptedAt).getTime() + ms);
}

/**
 * Award sprint XP to both participants after challenge resolves.
 *
 * @param {object} prisma
 * @param {string} challengeId
 * @param {string} challengerId
 * @param {string} challengedId
 * @param {"challenger"|"challenged"|"draw"} outcome
 * @returns {{ winnerXp: number, loserXp: number }}
 */
export async function awardSprintXp(prisma, challengeId, challengerId, challengedId, outcome) {
  const cfg = await getConfigs([
    "sprint.xp.winner",
    "sprint.xp.loser",
    "sprint.xp.draw",
    "sp.multiplier",
  ]);

  const winnerXp = Number(cfg["sprint.xp.winner"] ?? 150);
  const loserXp  = Number(cfg["sprint.xp.loser"]  ?? 30);
  const drawXp   = Number(cfg["sprint.xp.draw"]   ?? 75);
  const spMult   = Number(cfg["sp.multiplier"]     ?? 1);

  const activeSeason = await prisma.season
    .findFirst({ where: { isActive: true }, orderBy: { id: "desc" } })
    .then((s) => s?.id ?? 0)
    .catch(() => 0);

  const awards = [];

  if (outcome === "draw") {
    awards.push({ userId: challengerId, xp: drawXp, role: "draw" });
    awards.push({ userId: challengedId, xp: drawXp, role: "draw" });
  } else {
    const winnerId = outcome === "challenger" ? challengerId : challengedId;
    const loserId  = outcome === "challenger" ? challengedId : challengerId;
    awards.push({ userId: winnerId, xp: winnerXp, role: "winner" });
    awards.push({ userId: loserId,  xp: loserXp,  role: "loser" });
  }

  for (const { userId, xp, role } of awards) {
    const idempotencyKey = `sprint:${challengeId}:${userId}`;
    const spDelta = Math.round(xp * spMult);

    // XpLedger (v2.2 primary)
    try {
      await prisma.xpLedger.create({
        data: {
          userId,
          xpDelta: xp,
          spDelta,
          seasonId: activeSeason,
          source: "rule",
          idempotencyKey,
          note: `Sprint challenge ${role} — challenge ${challengeId}`,
        },
      });
    } catch (e) {
      if (e.code !== "P2002") throw e; // already awarded
    }

    // SeasonScore update — retry once on P2002 (race between create legs)
    if (spDelta > 0) {
      try {
        await prisma.seasonScore.upsert({
          where: { userId_seasonId: { userId, seasonId: activeSeason } },
          create: { userId, seasonId: activeSeason, spTotal: spDelta },
          update: { spTotal: { increment: spDelta } },
        });
      } catch (e) {
        if (e.code === "P2002") {
          // Race: another request created the row; retry as a plain update.
          await prisma.seasonScore.update({
            where: { userId_seasonId: { userId, seasonId: activeSeason } },
            data: { spTotal: { increment: spDelta } },
          }).catch(() => {});
        }
      }
    }

    // PointsLedger v1 bridge
    try {
      await prisma.pointsLedger.create({
        data: {
          userId,
          ruleId: role === "winner" ? "sprint_win" : role === "draw" ? "sprint_draw" : "sprint_participate",
          points: xp,
          note: `Sprint challenge ${role}`,
        },
      });
    } catch {
      // Rule may not exist yet — non-fatal
    }
  }

  return { winnerXp, loserXp };
}

/**
 * Resolve a sprint challenge: compute deltas, determine winner, award XP.
 * Called by the resolve route or by a cron job on expiry.
 *
 * @returns {{ status: string, challengerDelta: number, challengedDelta: number, winnerId: string|null }}
 */
export async function resolveSprintChallenge(prisma, challengeId) {
  const challenge = await prisma.gameChallenge.findUnique({
    where: { id: challengeId },
    select: {
      id: true, challengerId: true, challengedId: true,
      gameId: true, sprintStat: true, status: true,
      challengerBaseline: true, challengedBaseline: true,
    },
  });

  if (!challenge) throw new Error("CHALLENGE_NOT_FOUND");
  if (!["ACTIVE", "ACCEPTED"].includes(challenge.status)) {
    return { status: challenge.status, challengerDelta: 0, challengedDelta: 0, winnerId: null };
  }

  const stat = challenge.sprintStat ?? "hours";
  const field = stat === "achievements" ? "achievementsUnlocked" : "playtimeHours";

  const [challengerGame, challengedGame] = await Promise.all([
    prisma.userGame.findUnique({
      where: { userId_canonicalGameId: { userId: challenge.challengerId, canonicalGameId: challenge.gameId } },
      select: { playtimeHours: true, achievementsUnlocked: true },
    }),
    prisma.userGame.findUnique({
      where: { userId_canonicalGameId: { userId: challenge.challengedId, canonicalGameId: challenge.gameId } },
      select: { playtimeHours: true, achievementsUnlocked: true },
    }),
  ]);

  const baseline = (json) => {
    if (!json) return 0;
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    return parsed[stat === "achievements" ? "achievements" : "hours"] ?? 0;
  };

  const challengerNow = stat === "achievements"
    ? (challengerGame?.achievementsUnlocked ?? 0)
    : (challengerGame?.playtimeHours ?? 0);
  const challengedNow = stat === "achievements"
    ? (challengedGame?.achievementsUnlocked ?? 0)
    : (challengedGame?.playtimeHours ?? 0);

  const challengerDelta = Math.max(0, challengerNow - baseline(challenge.challengerBaseline));
  const challengedDelta = Math.max(0, challengedNow - baseline(challenge.challengedBaseline));

  let outcome;
  let winnerId = null;
  if (challengerDelta > challengedDelta) {
    outcome = "challenger";
    winnerId = challenge.challengerId;
  } else if (challengedDelta > challengerDelta) {
    outcome = "challenged";
    winnerId = challenge.challengedId;
  } else {
    outcome = "draw";
  }

  const finalStatus = outcome === "draw" ? "DRAW" : "COMPLETED";

  await prisma.gameChallenge.update({
    where: { id: challengeId },
    data: { status: finalStatus, challengerDelta, challengedDelta, winnerId, resolvedAt: new Date() },
  });

  await awardSprintXp(prisma, challengeId, challenge.challengerId, challenge.challengedId, outcome).catch(() => {});

  return { status: finalStatus, challengerDelta, challengedDelta, winnerId };
}
