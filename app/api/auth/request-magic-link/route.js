import { prisma } from "@/lib/prisma";
import { createMagicLoginToken } from "@/lib/tokens";
import { sendMagicLoginEmail } from "@/lib/email";
import { apiOk, apiError } from "@/lib/api/response";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_BODY", "Invalid JSON body.", 400);
  }

  const { email, redirectPath } = body ?? {};
  if (!email || typeof email !== "string") return apiError("MISSING_EMAIL", "Email required.", 400);

  const normalised = email.toLowerCase().trim();

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email: normalised } }).catch(() => null);
  if (user) {
    try {
      const token = await createMagicLoginToken(normalised);
      await sendMagicLoginEmail({
        to: normalised,
        token,
        redirectPath: redirectPath || "/",
      });
    } catch (err) {
      console.error("[request-magic-link] send error:", err);
    }
  }

  return apiOk({ sent: true });
}
