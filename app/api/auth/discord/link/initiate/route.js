import { requireSession } from "@/lib/api/auth";
import { randomBytes } from "crypto";

const CLIENT_ID = process.env.AUTH_DISCORD_ID;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/auth/discord/link/callback`;

const ALLOWED_RETURN_PATHS = ["/app/settings/account"];

export async function GET(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  if (!CLIENT_ID) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${BASE_URL}/app/settings/account?discord_link_error=not_configured` },
    });
  }

  const { searchParams } = new URL(request.url);
  const rawReturn = searchParams.get("return") ?? "";
  const returnPath = ALLOWED_RETURN_PATHS.includes(rawReturn) ? rawReturn : "/app/settings/account";

  const state = randomBytes(16).toString("hex");

  const discordUrl = new URL("https://discord.com/api/oauth2/authorize");
  discordUrl.searchParams.set("client_id", CLIENT_ID);
  discordUrl.searchParams.set("redirect_uri", CALLBACK_URL);
  discordUrl.searchParams.set("response_type", "code");
  discordUrl.searchParams.set("scope", "identify email");
  discordUrl.searchParams.set("state", state);

  const headers = new Headers({ Location: discordUrl.toString() });
  headers.append("Set-Cookie", `discord_link_state=${state}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/`);
  headers.append("Set-Cookie", `discord_link_return=${encodeURIComponent(returnPath)}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/`);

  return new Response(null, { status: 302, headers });
}
