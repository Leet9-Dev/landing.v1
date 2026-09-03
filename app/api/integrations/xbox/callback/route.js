import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { emitGamingAccountConnectedEvent } from "@/lib/gamification/engine";

const XBOX_CLIENT_ID = process.env.XBOX_CLIENT_ID;
const XBOX_CLIENT_SECRET = process.env.XBOX_CLIENT_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/integrations/xbox/callback`;

const CLEAR_COOKIES = [
  "xbox_oauth_state=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
  "xbox_oauth_return=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
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
  const rawReturn = decodeURIComponent(cookies["xbox_oauth_return"] || "");
  const returnBase = ALLOWED_RETURN_PATHS.includes(rawReturn) ? rawReturn : "/app/settings/platforms";

  if (error) return redirect(`${returnBase}?xbox_error=cancelled`, true);

  const expectedState = cookies["xbox_oauth_state"];
  if (!state || !expectedState || state !== expectedState) {
    return redirect(`${returnBase}?xbox_error=invalid_state`, true);
  }
  if (!code) return redirect(`${returnBase}?xbox_error=no_code`, true);
  if (!XBOX_CLIENT_ID || !XBOX_CLIENT_SECRET) {
    return redirect(`${returnBase}?xbox_error=not_configured`, true);
  }

  // 1. Exchange authorization code for Microsoft access token.
  let msAccessToken;
  try {
    const tokenRes = await fetch("https://login.microsoftonline.com/consumers/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: XBOX_CLIENT_ID,
        client_secret: XBOX_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: CALLBACK_URL,
        scope: "XboxLive.signin offline_access",
      }),
    });
    if (!tokenRes.ok) {
      const txt = await tokenRes.text().catch(() => "");
      console.error("Xbox token exchange failed:", txt.slice(0, 200));
      return redirect(`${returnBase}?xbox_error=token_exchange_failed`, true);
    }
    const tokenData = await tokenRes.json();
    msAccessToken = tokenData.access_token;
  } catch {
    return redirect(`${returnBase}?xbox_error=network_error`, true);
  }

  // 2. Exchange Microsoft token for Xbox Live (XBL) token.
  let xblToken, userHash;
  try {
    const xblRes = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        Properties: { AuthMethod: "RPS", SiteName: "user.auth.xboxlive.com", RpsTicket: `d=${msAccessToken}` },
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT",
      }),
    });
    if (!xblRes.ok) return redirect(`${returnBase}?xbox_error=xbl_auth_failed`, true);
    const xblData = await xblRes.json();
    xblToken = xblData.Token;
    userHash = xblData.DisplayClaims?.xui?.[0]?.uhs;
    if (!xblToken || !userHash) return redirect(`${returnBase}?xbox_error=xbl_token_missing`, true);
  } catch {
    return redirect(`${returnBase}?xbox_error=xbl_network_error`, true);
  }

  // 3. Exchange XBL token for XSTS token.
  let xstsToken, xuid;
  try {
    const xstsRes = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        Properties: { SandboxId: "RETAIL", UserTokens: [xblToken] },
        RelyingParty: "http://xboxlive.com",
        TokenType: "JWT",
      }),
    });
    if (!xstsRes.ok) {
      const xstsBody = await xstsRes.json().catch(() => ({}));
      const xerr = xstsBody.XErr;
      // 2148916233 = no Xbox account; 2148916238 = child account requires parental consent
      if (xerr === 2148916233) return redirect(`${returnBase}?xbox_error=no_xbox_account`, true);
      return redirect(`${returnBase}?xbox_error=xsts_failed`, true);
    }
    const xstsData = await xstsRes.json();
    xstsToken = xstsData.Token;
    xuid = xstsData.DisplayClaims?.xui?.[0]?.xid;
    if (!xstsToken || !xuid) return redirect(`${returnBase}?xbox_error=xsts_token_missing`, true);
  } catch {
    return redirect(`${returnBase}?xbox_error=xsts_network_error`, true);
  }

  // 4. Fetch Gamertag from Xbox Profile API.
  let gamertag;
  try {
    const profileRes = await fetch(
      `https://profile.xboxlive.com/users/xuid(${xuid})/profile/settings?settings=Gamertag`,
      {
        headers: {
          Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
          "x-xbl-contract-version": "2",
          Accept: "application/json",
        },
      }
    );
    if (!profileRes.ok) return redirect(`${returnBase}?xbox_error=profile_fetch_failed`, true);
    const profileData = await profileRes.json();
    gamertag = profileData.profileUsers?.[0]?.settings?.find((s) => s.id === "Gamertag")?.value;
    if (!gamertag) return redirect(`${returnBase}?xbox_error=gamertag_missing`, true);
  } catch {
    return redirect(`${returnBase}?xbox_error=profile_network_error`, true);
  }

  // 5. Upsert PlatformAccount.
  const userId = session.user.id;
  const now = new Date();

  let existing;
  try {
    existing = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "xbox" } },
    });

    await prisma.platformAccount.upsert({
      where: { userId_provider: { userId, provider: "xbox" } },
      create: {
        userId,
        provider: "xbox",
        externalUserId: gamertag,
        username: gamertag,
        displayName: gamertag,
        status: "connected",
        syncStatus: "idle",
        connectedAt: now,
        capabilities: { gameLibrary: true, achievements: true, gamerscore: true },
        metadata: { xuid, connectedVia: "oauth_microsoft" },
      },
      update: {
        externalUserId: gamertag,
        username: gamertag,
        displayName: gamertag,
        status: "connected",
        connectedAt: now,
        metadata: { xuid, connectedVia: "oauth_microsoft" },
      },
    });
  } catch (dbErr) {
    const detail = encodeURIComponent((dbErr?.message || "db_error").slice(0, 120));
    return redirect(`${returnBase}?xbox_error=db_failed&xbox_detail=${detail}`, true);
  }

  if (!existing || existing.status !== "connected") {
    const totalAccounts = await prisma.platformAccount.count({
      where: { userId, status: "connected" },
    }).catch(() => 1);
    emitGamingAccountConnectedEvent(prisma, userId, "xbox", totalAccounts).catch(() => {});
  }

  return redirect(`${returnBase}?xbox_connected=1`, true);
}
