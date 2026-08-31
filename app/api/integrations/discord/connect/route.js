import { requireSession } from "@/lib/api/auth";
import { apiError } from "@/lib/api/response";
import { cookies } from "next/headers";
import crypto from "crypto";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/integrations/discord/callback`;
const SCOPES = "identify";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  if (!DISCORD_CLIENT_ID) {
    return apiError("DISCORD_NOT_CONFIGURED", "Discord integration is not configured.", 503);
  }

  const state = crypto.randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("discord_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: "code",
    scope: SCOPES,
    state,
    prompt: "consent",
  });

  return Response.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
}
