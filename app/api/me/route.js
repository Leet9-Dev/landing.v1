import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth";
import { PLATFORM_ACCOUNT_STATUS } from "@/lib/platforms/platforms";
import { computeLevel, computeRankInfo } from "@/lib/scoring/l9Points";
import { revokeDiscordToken } from "@/lib/discord";

const GAME_PLATFORMS = ["steam", "psn", "xbox"];

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;
  const realName = session.user.name || "Gamer";

  const [platformRows, ledgerAgg, xpAgg, gamesCount] = await Promise.all([
    prisma.platformAccount.findMany({
      where: { userId, status: PLATFORM_ACCOUNT_STATUS.CONNECTED },
    }),
    prisma.pointsLedger.aggregate({ where: { userId }, _sum: { points: true } }),
    prisma.xpLedger.aggregate({ where: { userId }, _sum: { xpDelta: true } }).catch(() => ({ _sum: { xpDelta: null } })),
    prisma.userGame.count({ where: { userId } }),
  ]);

  const platformsConnected = platformRows
    .map((r) => r.provider)
    .filter((p) => GAME_PLATFORMS.includes(p));

  const xpFromV2 = xpAgg._sum.xpDelta ?? 0;
  const xpFromV1 = ledgerAgg._sum.points ?? 0;
  const l9Points = xpFromV2 > 0 ? xpFromV2 : xpFromV1;
  const level = computeLevel(l9Points);
  const rankInfo = computeRankInfo(l9Points);

  return apiOk({
    id: userId,
    gamerTag: realName,
    displayName: realName,
    avatarUrl: session.user.image || null,
    avatarInitials: realName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    level,
    l9Points,
    rankTier: rankInfo.rankTier,
    nextRank: rankInfo.nextRank,
    rankProgressPct: rankInfo.rankProgressPct,
    pointsToNextRank: rankInfo.pointsToNextRank,
    tribeId: null,
    tribeTag: null,
    archetype: null,
    profileCompletenessPct: null,
    platformsConnected,
    gamesCount,
  });
}

export async function DELETE(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const body = await request.json().catch(() => ({}));
  if (body.confirm !== "DELETE") {
    return apiError("CONFIRM_REQUIRED", "Pass { confirm: 'DELETE' } to confirm account deletion.", 400);
  }

  // Fetch pre-deletion data needed for cleanup that can't run inside the transaction.
  const [discordAccount, userRecord] = await Promise.all([
    prisma.account.findFirst({
      where: { userId, provider: "discord" },
      select: { access_token: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, pendingEmail: true },
    }),
  ]);

  // VerificationToken has no FK to User, so orphan leet9-confirm tokens must be
  // deleted explicitly. Collect the identifiers for both confirmed and pending addresses.
  const leet9ConfirmIdentifiers = [
    userRecord?.email       ? `leet9-confirm:${userRecord.email}`       : null,
    userRecord?.pendingEmail ? `leet9-confirm:${userRecord.pendingEmail}` : null,
  ].filter(Boolean);

  // Delete in dependency order to avoid FK violations.
  // Token revocation happens AFTER the transaction so a failed transaction
  // never leaves the user unable to delete (a still-valid token at Discord
  // expires naturally within 7 days).
  await prisma.$transaction([
    prisma.gameListItem.deleteMany({ where: { list: { userId } } }),
    prisma.gameList.deleteMany({ where: { userId } }),
    prisma.gameReview.deleteMany({ where: { userId } }),
    prisma.userBadge.deleteMany({ where: { userId } }),
    prisma.userStreak.deleteMany({ where: { userId } }),
    prisma.pointsLedger.deleteMany({ where: { userId } }),
    prisma.xpLedger.deleteMany({ where: { userId } }),
    prisma.userRuleState.deleteMany({ where: { userId } }),
    prisma.gamificationEvent.deleteMany({ where: { userId } }),
    prisma.userBrandPoints.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.userFollow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } }),
    prisma.npsSurvey.deleteMany({ where: { userId } }),
    prisma.seasonScore.deleteMany({ where: { userId } }),
    prisma.dailyCounter.deleteMany({ where: { userId } }),
    prisma.comparisonUnlock.deleteMany({ where: { userId } }),
    prisma.platformDetectedGame.deleteMany({ where: { platformAccount: { userId } } }),
    prisma.platformSyncRun.deleteMany({ where: { platformAccount: { userId } } }),
    prisma.platformAccount.deleteMany({ where: { userId } }),
    prisma.userGame.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    ...(leet9ConfirmIdentifiers.length > 0
      ? [prisma.verificationToken.deleteMany({ where: { identifier: { in: leet9ConfirmIdentifiers } } })]
      : []),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  // Revoke the Discord access token now that the DB row is gone.
  // Non-fatal: log failures, never surface them to the user.
  if (discordAccount?.access_token) {
    revokeDiscordToken(discordAccount.access_token).catch(err =>
      console.error("[me DELETE] Discord token revocation failed:", err.message)
    );
  }

  return apiOk({ deleted: true });
}
