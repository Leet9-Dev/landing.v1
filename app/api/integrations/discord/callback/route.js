import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { emitGamingAccountConnectedEvent } from "@/lib/gamification/engine";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/integrations/discord/callback`;

const CLEAR_COOKIES = [
  "discord_oauth_state=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
  "discord_oauth_return=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
];

function redirect(path, clearCookies = false) {
  const headers = new Headers({ "Location": `${BASE_URL}${path}` });
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

  // Read state + return cookies early so we can redirect to the right place on errors too.
  const cookieHeader0 = request.headers.get("cookie") || "";
  const parsedCookies0 = Object.fromEntries(
    cookieHeader0.split(";").map((c) => {
      const idx = c.indexOf("=");
      return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    })
  );
  const ALLOWED_RETURN_PATHS = ["/app/settings/platforms", "/app/profile"];
  const rawReturn0 = decodeURIComponent(parsedCookies0["discord_oauth_return"] || "");
  const returnBase0 = ALLOWED_RETURN_PATHS.includes(rawReturn0) ? rawReturn0 : "/app/settings/platforms";

  if (error) {
    return redirect(`${returnBase0}?discord_error=cancelled`, true);
  }

  const expectedState = parsedCookies0["discord_oauth_state"];
  const returnBase = returnBase0;

  if (!state || !expectedState || state !== expectedState) {
    return redirect(`${returnBase}?discord_error=invalid_state`, true);
  }

  if (!code) {
    return redirect(`${returnBase}?discord_error=no_code`, true);
  }

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return redirect(`${returnBase}?discord_error=not_configured`, true);
  }

  // Exchange code for token.
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: CALLBACK_URL,
    }),
  });

  if (!tokenRes.ok) {
    return redirect(`${returnBase}?discord_error=token_exchange_failed`, true);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Fetch Discord user profile.
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    return redirect(`${returnBase}?discord_error=profile_fetch_failed`, true);
  }

  const discordUser = await userRes.json();
  const discordId = discordUser.id;
  const username = discordUser.username;
  const displayName = discordUser.global_name || discordUser.username;
  const avatarHash = discordUser.avatar;
  const avatarUrl = avatarHash
    ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`
    : null;

  const userId = session.user.id;
  const now = new Date();

  const existing = await prisma.platformAccount.findUnique({
    where: { userId_provider: { userId, provider: "discord" } },
  });

  await prisma.platformAccount.upsert({
    where: { userId_provider: { userId, provider: "discord" } },
    create: {
      userId,
      provider: "discord",
      externalUserId: discordId,
      username,
      displayName,
      status: "connected",
      syncStatus: "idle",
      connectedVia: "oauth_discord",
      connectedAt: now,
      capabilities: { presence: true, gameLibrary: false },
      metadata: { avatarUrl },
    },
    update: {
      externalUserId: discordId,
      username,
      displayName,
      status: "connected",
      connectedVia: "oauth_discord",
      connectedAt: now,
      metadata: { avatarUrl },
    },
  });

  if (!existing || existing.status !== "connected") {
    emitGamingAccountConnectedEvent(prisma, userId, "discord").catch(() => {});
  }

  return redirect(`${returnBase}?discord_connected=1`, true);
}
