import { requireSession } from "@/lib/api/auth";
import { apiError } from "@/lib/api/response";
import crypto from "crypto";

const RIOT_CLIENT_ID = process.env.RIOT_CLIENT_ID;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/integrations/riot/callback`;
const SCOPES = "openid";
const ALLOWED_RETURN_PATHS = ["/app/settings/platforms", "/app/profile"];

export async function GET(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  if (!RIOT_CLIENT_ID) {
    return apiError("RIOT_NOT_CONFIGURED", "Riot Games integration is not configured.", 503);
  }

  const { searchParams } = new URL(request.url);
  const rawReturn = searchParams.get("return_to") || "";
  const returnTo = ALLOWED_RETURN_PATHS.includes(rawReturn) ? rawReturn : "/app/settings/platforms";

  const state = crypto.randomBytes(16).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: RIOT_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: "code",
    scope: SCOPES,
    state,
    nonce,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOpts = `HttpOnly; ${isProduction ? "Secure; " : ""}SameSite=Lax; Max-Age=300; Path=/`;

  const headers = new Headers({
    Location: `https://auth.riotgames.com/authorize?${params}`,
  });
  headers.append("Set-Cookie", `riot_oauth_state=${state}; ${cookieOpts}`);
  headers.append("Set-Cookie", `riot_oauth_return=${encodeURIComponent(returnTo)}; ${cookieOpts}`);

  return new Response(null, { status: 302, headers });
}
