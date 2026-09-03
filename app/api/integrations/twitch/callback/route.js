import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { emitGamingAccountConnectedEvent } from "@/lib/gamification/engine";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/integrations/twitch/callback`;

const CLEAR_COOKIES = [
  "twitch_oauth_state=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
  "twitch_oauth_return=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
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
  const rawReturn = decodeURIComponent(cookies["twitch_oauth_return"] || "");
  const returnBase = ALLOWED_RETURN_PATHS.includes(rawReturn) ? rawReturn : "/app/settings/platforms";

  if (error) return redirect(`${returnBase}?twitch_error=cancelled`, true);

  const expectedState = cookies["twitch_oauth_state"];
  if (!state || !expectedState || state !== expectedState) {
    return redirect(`${returnBase}?twitch_error=invalid_state`, true);
  }
  if (!code) return redirect(`${returnBase}?twitch_error=no_code`, true);
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    return redirect(`${returnBase}?twitch_error=not_configured`, true);
  }

  // 1. Exchange code for access token.
  let accessToken;
  try {
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });
    if (!tokenRes.ok) {
      console.error("Twitch token exchange failed:", tokenRes.status);
      return redirect(`${returnBase}?twitch_error=token_exchange_failed`, true);
    }
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
  } catch {
    return redirect(`${returnBase}?twitch_error=network_error`, true);
  }

  // 2. Fetch Twitch user profile.
  let twitchUser;
  try {
    const userRes = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-Id": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!userRes.ok) return redirect(`${returnBase}?twitch_error=profile_fetch_failed`, true);
    const userData = await userRes.json();
    twitchUser = userData.data?.[0];
    if (!twitchUser?.id) return redirect(`${returnBase}?twitch_error=profile_missing`, true);
  } catch {
    return redirect(`${returnBase}?twitch_error=profile_network_error`, true);
  }

  const { id: twitchId, login, display_name, profile_image_url } = twitchUser;

  // 3. Upsert PlatformAccount.
  const userId = session.user.id;
  const now = new Date();

  let existing;
  try {
    existing = await prisma.platformAccount.findUnique({
      where: { userId_provider: { userId, provider: "twitch" } },
    });

    await prisma.platformAccount.upsert({
      where: { userId_provider: { userId, provider: "twitch" } },
      create: {
        userId,
        provider: "twitch",
        externalUserId: twitchId,
        username: login,
        displayName: display_name,
        status: "connected",
        syncStatus: "idle",
        connectedAt: now,
        capabilities: { gameHistory: true, streaming: true },
        metadata: { profileImageUrl: profile_image_url ?? null, connectedVia: "oauth_twitch" },
      },
      update: {
        externalUserId: twitchId,
        username: login,
        displayName: display_name,
        status: "connected",
        connectedAt: now,
        metadata: { profileImageUrl: profile_image_url ?? null, connectedVia: "oauth_twitch" },
      },
    });
  } catch (dbErr) {
    const detail = encodeURIComponent((dbErr?.message || "db_error").slice(0, 120));
    return redirect(`${returnBase}?twitch_error=db_failed&twitch_detail=${detail}`, true);
  }

  if (!existing || existing.status !== "connected") {
    const totalAccounts = await prisma.platformAccount.count({
      where: { userId, status: "connected" },
    }).catch(() => 1);
    emitGamingAccountConnectedEvent(prisma, userId, "twitch", totalAccounts).catch(() => {});
  }

  return redirect(`${returnBase}?twitch_connected=1`, true);
}
