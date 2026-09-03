import { requireSession } from "@/lib/api/auth";
import { apiError } from "@/lib/api/response";
import crypto from "crypto";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/integrations/twitch/callback`;
const SCOPES = "user:read:email";
const ALLOWED_RETURN_PATHS = ["/app/settings/platforms", "/app/profile"];

export async function GET(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  if (!TWITCH_CLIENT_ID) {
    return apiError("TWITCH_NOT_CONFIGURED", "Twitch integration is not configured.", 503);
  }

  const { searchParams } = new URL(request.url);
  const rawReturn = searchParams.get("return_to") || "";
  const returnTo = ALLOWED_RETURN_PATHS.includes(rawReturn) ? rawReturn : "/app/settings/platforms";

  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: "code",
    scope: SCOPES,
    state,
    force_verify: "false",
  });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOpts = `HttpOnly; ${isProduction ? "Secure; " : ""}SameSite=Lax; Max-Age=300; Path=/`;

  const headers = new Headers({
    Location: `https://id.twitch.tv/oauth2/authorize?${params}`,
  });
  headers.append("Set-Cookie", `twitch_oauth_state=${state}; ${cookieOpts}`);
  headers.append("Set-Cookie", `twitch_oauth_return=${encodeURIComponent(returnTo)}; ${cookieOpts}`);

  return new Response(null, { status: 302, headers });
}
