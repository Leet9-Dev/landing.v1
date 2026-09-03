import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { emitGamingAccountConnectedEvent } from "@/lib/gamification/engine";

const RIOT_CLIENT_ID = process.env.RIOT_CLIENT_ID;
const RIOT_CLIENT_SECRET = process.env.RIOT_CLIENT_SECRET;
const RIOT_REGION = process.env.RIOT_REGION || "europe";
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/integrations/riot/callback`;

const CLEAR_COOKIES = [
  "riot_oauth_state=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
  "riot_oauth_return=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
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
  const rawReturn = decodeURIComponent(cookies["riot_oauth_return"] || "");
  const returnBase = ALLOWED_RETURN_PATHS.includes(rawReturn) ? rawReturn : "/app/settings/platforms";

  if (error) return redirect(`${returnBase}?riot_error=cancelled`, true);

  const expectedState = cookies["riot_oauth_state"];
  if (!state || !expectedState || state !== expectedState) {
    return redirect(`${returnBase}?riot_error=invalid_state`, true);
  }
  if (!code) return redirect(`${returnBase}?riot_error=no_code`, true);
  if (!RIOT_CLIENT_ID || !RIOT_CLIENT_SECRET) {
    return redirect(`${returnBase}?riot_error=not_configured`, true);
  }

  // 1. Exchange authorization code for tokens.
  let accessToken, puuid;
  try {
    const credentials = Buffer.from(`${RIOT_CLIENT_ID}:${RIOT_CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://auth.riotgames.com/token", {
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
      console.error("Riot token exchange failed:", tokenRes.status);
      return redirect(`${returnBase}?riot_error=token_exchange_failed`, true);
    }
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;

    // Extract PUUID from id_token JWT (middle segment, no verification needed here —
    // we only use it to query the Riot API which validates on its side).
    const idToken = tokenData.id_token;
    if (idToken) {
      try {
        const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf-8"));
        puuid = payload.sub;
      } catch {}
    }
  } catch {
    return redirect(`${returnBase}?riot_error=network_error`, true);
  }

  // 2. Resolve PUUID via userinfo endpoint if not in id_token.
  if (!puuid && accessToken) {
    try {
      const userInfoRes = await fetch("https://auth.riotgames.com/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        puuid = userInfo.sub;
      }
    } catch {}
  }

  if (!puuid) return redirect(`${returnBase}?riot_error=puuid_missing`, true);

  // 3. Resolve Riot ID (gameName#tagLine) from PUUID via Riot Account API.
  let riotId, gameName, tagLine;
  try {
    const accountRes = await fetch(
      `https://${RIOT_REGION}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`,
      { headers: { "X-Riot-Token": process.env.RIOT_API_KEY || "" } }
    );
    if (accountRes.ok) {
      const accountData = await accountRes.json();
      gameName = accountData.gameName;
      tagLine = accountData.tagLine;
      riotId = gameName && tagLine ? `${gameName}#${tagLine}` : null;
    }
  } catch {}

  // Fall back to PUUID as identifier if Riot API key not set or lookup failed.
  const externalUserId = riotId ?? puuid;
  const displayName = riotId ?? puuid;

  // 4. Upsert PlatformAccount.
  const userId = session.user.id;
  const now = new Date();

  let existing;
  try {
    existing = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "riot" } },
    });

    await prisma.platformAccount.upsert({
      where: { userId_provider: { userId, provider: "riot" } },
      create: {
        userId,
        provider: "riot",
        externalUserId,
        username: externalUserId,
        displayName,
        status: "connected",
        syncStatus: "idle",
        connectedAt: now,
        capabilities: { lol: true, valorant: true, tft: true },
        metadata: { puuid, gameName: gameName ?? null, tagLine: tagLine ?? null, connectedVia: "oauth_rso" },
      },
      update: {
        externalUserId,
        username: externalUserId,
        displayName,
        status: "connected",
        connectedAt: now,
        metadata: { puuid, gameName: gameName ?? null, tagLine: tagLine ?? null, connectedVia: "oauth_rso" },
      },
    });
  } catch (dbErr) {
    const detail = encodeURIComponent((dbErr?.message || "db_error").slice(0, 120));
    return redirect(`${returnBase}?riot_error=db_failed&riot_detail=${detail}`, true);
  }

  if (!existing || existing.status !== "connected") {
    const totalAccounts = await prisma.platformAccount.count({
      where: { userId, status: "connected" },
    }).catch(() => 1);
    emitGamingAccountConnectedEvent(prisma, userId, "riot", totalAccounts).catch(() => {});
  }

  return redirect(`${returnBase}?riot_connected=1`, true);
}
