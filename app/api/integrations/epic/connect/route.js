import { requireSession } from "@/lib/api/auth";
import { randomBytes } from "crypto";

const EPIC_CLIENT_ID = process.env.EPIC_CLIENT_ID;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";
const CALLBACK_URL = `${BASE_URL}/api/integrations/epic/callback`;

const ALLOWED_RETURN_PATHS = ["/app/settings/platforms", "/app/profile"];

export async function GET(request) {
  const { unauthenticated } = await requireSession();
  if (unauthenticated) {
    return new Response(null, { status: 302, headers: { Location: `${BASE_URL}/` } });
  }

  if (!EPIC_CLIENT_ID) {
    const { searchParams } = new URL(request.url);
    const rawReturn = searchParams.get("return") || "";
    const returnPath = ALLOWED_RETURN_PATHS.includes(rawReturn) ? rawReturn : "/app/settings/platforms";
    return new Response(null, {
      status: 302,
      headers: { Location: `${BASE_URL}${returnPath}?epic_error=not_configured` },
    });
  }

  const { searchParams } = new URL(request.url);
  const rawReturn = searchParams.get("return") || "";
  const returnPath = ALLOWED_RETURN_PATHS.includes(rawReturn) ? rawReturn : "/app/settings/platforms";

  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: EPIC_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: "basic_profile",
    state,
  });

  const headers = new Headers({
    Location: `https://www.epicgames.com/id/authorize?${params}`,
  });
  headers.append(
    "Set-Cookie",
    `epic_oauth_state=${state}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/`
  );
  headers.append(
    "Set-Cookie",
    `epic_oauth_return=${encodeURIComponent(returnPath)}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/`
  );

  return new Response(null, { status: 302, headers });
}
