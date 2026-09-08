import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { emitGamingAccountConnectedEvent, emitGameAddedEvent } from "@/lib/gamification/engine";
import { fetchBattlenetGames } from "@/lib/integrations/battlenet/battlenetClient";
import { normalizeBattlenetGames } from "@/lib/integrations/battlenet/battlenetNormalizer";
import { matchDetectedGameToCanonical } from "@/lib/platforms/canonicalMatching";
import { MOCK_EXTERNAL_SOURCES } from "@/lib/mock/gameExternalSources";

const BATTLENET_CLIENT_ID = process.env.BATTLENET_CLIENT_ID;
const BATTLENET_CLIENT_SECRET = process.env.BATTLENET_CLIENT_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/integrations/battlenet/callback`;

const CLEAR_COOKIES = [
  "battlenet_oauth_state=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
  "battlenet_oauth_return=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
];

function redirect(path, clearCookies = false) {
  const headers = new Headers({ Location: `${BASE_URL}${path}` });
  if (clearCookies) {
    headers.append("Set-Cookie", CLEAR_COOKIES[0]);
    headers.append("Set-Cookie", CLEAR_COOKIES[1]);
  }
  return new Response(null, { status: 302, headers });
}

export async function GET(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return redirect("/");

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const idx = c.indexOf("=");
      return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    })
  );

  const ALLOWED_RETURN_PATHS = ["/app/settings/platforms", "/app/profile"];
  const rawReturn = decodeURIComponent(cookies["battlenet_oauth_return"] || "");
  const returnBase = ALLOWED_RETURN_PATHS.includes(rawReturn) ? rawReturn : "/app/settings/platforms";

  if (error) return redirect(`${returnBase}?battlenet_error=cancelled`, true);

  const expectedState = cookies["battlenet_oauth_state"];
  if (!state || !expectedState || state !== expectedState) {
    return redirect(`${returnBase}?battlenet_error=invalid_state`, true);
  }
  if (!code) return redirect(`${returnBase}?battlenet_error=no_code`, true);
  if (!BATTLENET_CLIENT_ID || !BATTLENET_CLIENT_SECRET) {
    return redirect(`${returnBase}?battlenet_error=not_configured`, true);
  }

  // 1. Exchange authorization code for tokens.
  let accessToken, sub, expiresAt;
  try {
    const credentials = Buffer.from(`${BATTLENET_CLIENT_ID}:${BATTLENET_CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://oauth.battle.net/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });
    if (!tokenRes.ok) {
      console.error("Battle.net token exchange failed:", tokenRes.status);
      return redirect(`${returnBase}?battlenet_error=token_exchange_failed`, true);
    }
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
    sub = tokenData.sub ?? null;
    const expiresIn = tokenData.expires_in ?? 86400;
    expiresAt = Date.now() + expiresIn * 1000;
  } catch {
    return redirect(`${returnBase}?battlenet_error=network_error`, true);
  }

  // 2. Fetch Battle.net account info (BattleTag).
  let battletag = null;
  let accountId = sub;
  if (accessToken) {
    try {
      const userInfoRes = await fetch("https://oauth.battle.net/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        battletag = userInfo.battletag ?? null;
        accountId = userInfo.sub ?? accountId;
      }
    } catch {}
  }

  if (!accountId && !battletag) {
    return redirect(`${returnBase}?battlenet_error=profile_fetch_failed`, true);
  }

  const externalUserId = battletag ?? String(accountId);
  const displayName = battletag ?? String(accountId);
  const region = process.env.BATTLENET_REGION || "eu";

  // 3. Upsert PlatformAccount.
  const userId = session.user.id;
  const now = new Date();
  const meta = {
    battletag: battletag ?? null,
    accountId: accountId ? String(accountId) : null,
    access_token: accessToken,
    expires_at: expiresAt,
    region,
    connectedVia: "oauth",
  };

  let existing, platformAccount;
  try {
    existing = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "battlenet" } },
    });

    platformAccount = await prisma.platformAccount.upsert({
      where: { userId_provider: { userId, provider: "battlenet" } },
      create: {
        userId,
        provider: "battlenet",
        externalUserId,
        username: externalUserId,
        displayName,
        status: "connected",
        syncStatus: "syncing",
        connectedAt: now,
        capabilities: { diablo: true, overwatch: true, wow: true, starcraft: true },
        metadata: meta,
      },
      update: {
        externalUserId,
        username: externalUserId,
        displayName,
        status: "connected",
        syncStatus: "syncing",
        connectedAt: now,
        metadata: meta,
      },
    });
  } catch (dbErr) {
    const detail = encodeURIComponent((dbErr?.message || "db_error").slice(0, 120));
    return redirect(`${returnBase}?battlenet_error=db_failed&battlenet_detail=${detail}`, true);
  }

  if (!existing || existing.status !== "connected") {
    const totalAccounts = await prisma.platformAccount.count({
      where: { userId, status: "connected" },
    }).catch(() => 1);
    emitGamingAccountConnectedEvent(prisma, userId, "battlenet", totalAccounts).catch(() => {});
  }

  // 4. Auto-sync: import games immediately while token is fresh.
  //    Runs before redirect so games land in the DB on first connect.
  try {
    const rawGames = await fetchBattlenetGames({
      battletag: externalUserId,
      accountId: accountId ? String(accountId) : null,
      accessToken,
      region,
    });
    const normalized = normalizeBattlenetGames(rawGames);
    const newGameIds = [];

    for (const g of normalized) {
      const canonicalGameId = matchDetectedGameToCanonical("battlenet", g.externalId, MOCK_EXTERNAL_SOURCES);
      if (!canonicalGameId) continue;
      const existingGame = await prisma.userGame.findUnique({
        where: { userId_canonicalGameId: { userId, canonicalGameId } },
        select: { id: true },
      });
      await prisma.userGame.upsert({
        where: { userId_canonicalGameId: { userId, canonicalGameId } },
        create: {
          userId,
          canonicalGameId,
          sourceProvider: "battlenet",
          sourcePlatformAccountId: platformAccount.id,
          firstDetectedAt: now,
          lastDetectedAt: now,
          playtimeHours: null,
          sourceConfidence: "high",
        },
        update: {
          lastDetectedAt: now,
          sourceProvider: "battlenet",
          sourcePlatformAccountId: platformAccount.id,
          sourceConfidence: "high",
        },
      });
      if (!existingGame) newGameIds.push(canonicalGameId);
    }

    if (newGameIds.length > 0) {
      const totalGamesRow = await prisma.userGame.count({ where: { userId } });
      for (let i = 0; i < newGameIds.length; i++) {
        const runningTotal = totalGamesRow - newGameIds.length + i + 1;
        emitGameAddedEvent(prisma, userId, newGameIds[i], runningTotal).catch(() => {});
      }
    }

    await prisma.platformAccount.update({
      where: { id: platformAccount.id },
      data: { syncStatus: "success", lastSyncAt: now },
    });
  } catch {
    // Non-fatal — account is connected, sync can be retried manually.
    await prisma.platformAccount.update({
      where: { id: platformAccount.id },
      data: { syncStatus: "failed" },
    }).catch(() => {});
  }

  return redirect(`${returnBase}?battlenet_connected=1`, true);
}
