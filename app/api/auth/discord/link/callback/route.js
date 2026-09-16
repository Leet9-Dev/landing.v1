import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { emitGamingAccountConnectedEvent } from "@/lib/gamification/engine";

const CLIENT_ID = process.env.AUTH_DISCORD_ID;
const CLIENT_SECRET = process.env.AUTH_DISCORD_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/auth/discord/link/callback`;

const CLEAR_COOKIES = [
  "discord_link_state=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
  "discord_link_return=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/",
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

  const returnPath = decodeURIComponent(cookies["discord_link_return"] || "") || "/app/settings/account";

  if (error) return redirect(`${returnPath}?discord_link_error=cancelled`, true);

  const expectedState = cookies["discord_link_state"];
  if (!state || !expectedState || state !== expectedState) {
    return redirect(`${returnPath}?discord_link_error=invalid_state`, true);
  }
  if (!code) return redirect(`${returnPath}?discord_link_error=no_code`, true);
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return redirect(`${returnPath}?discord_link_error=not_configured`, true);
  }

  // 1. Exchange code for access token.
  let accessToken;
  try {
    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${creds}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });
    if (!tokenRes.ok) {
      console.error("[discord/link] token exchange failed:", tokenRes.status);
      return redirect(`${returnPath}?discord_link_error=token_exchange_failed`, true);
    }
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
  } catch {
    return redirect(`${returnPath}?discord_link_error=network_error`, true);
  }

  // 2. Fetch Discord user info.
  let discordId, discordUsername;
  try {
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) return redirect(`${returnPath}?discord_link_error=profile_fetch_failed`, true);
    const userInfo = await userRes.json();
    discordId = userInfo.id;
    discordUsername = userInfo.global_name ?? userInfo.username ?? null;
  } catch {
    return redirect(`${returnPath}?discord_link_error=network_error`, true);
  }

  const userId = session.user.id;

  // 3. Check if this Discord account is already linked to a DIFFERENT Leet9 user.
  const existingLink = await prisma.account.findFirst({
    where: {
      provider: "discord",
      providerAccountId: discordId,
      NOT: { userId },
    },
    select: { id: true },
  }).catch(() => null);

  if (existingLink) {
    return redirect(`${returnPath}?discord_link_error=already_linked_to_another_account`, true);
  }

  // 4. Upsert the NextAuth Account row.
  try {
    await prisma.account.upsert({
      where: { provider_providerAccountId: { provider: "discord", providerAccountId: discordId } },
      create: {
        userId,
        type: "oauth",
        provider: "discord",
        providerAccountId: discordId,
        access_token: accessToken,
        token_type: "Bearer",
        scope: "identify email",
      },
      update: {
        userId,
        access_token: accessToken,
      },
    });
  } catch (dbErr) {
    console.error("[discord/link] db error:", dbErr.message);
    return redirect(`${returnPath}?discord_link_error=db_failed`, true);
  }

  // 5. Also auto-connect PlatformAccount (gaming identity) — same as the OAuth sign-in path.
  try {
    await prisma.platformAccount.upsert({
      where: { userId_provider: { userId, provider: "discord" } },
      create: {
        userId,
        provider: "discord",
        externalUserId: discordId,
        username: discordUsername,
        displayName: discordUsername,
        status: "connected",
        syncStatus: "idle",
        connectedAt: new Date(),
        capabilities: { streaming: true },
        metadata: { connectedVia: "account_link" },
      },
      update: {
        externalUserId: discordId,
        username: discordUsername,
        displayName: discordUsername,
        status: "connected",
        connectedAt: new Date(),
        disconnectedAt: null,
        metadata: { connectedVia: "account_link" },
      },
    });
    const totalAccounts = await prisma.platformAccount.count({
      where: { userId, status: "connected" },
    });
    emitGamingAccountConnectedEvent(prisma, userId, "discord", totalAccounts).catch(() => {});
  } catch (e) {
    // Non-fatal — sign-in account is linked; gaming identity sync can be retried.
    console.error("[discord/link] PlatformAccount upsert failed:", e.message);
  }

  return redirect(`${returnPath}?discord_linked=1`, true);
}
