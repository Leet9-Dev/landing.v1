import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { consumeVerificationToken } from "@/lib/tokens";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return apiError("MISSING_TOKEN", "Token missing.", 400);

  const email = await consumeVerificationToken(token);
  if (!email) return apiError("INVALID_TOKEN", "This link is invalid or has expired.", 400);

  try {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
  } catch (e) {
    if (e.code === "P2025") return apiError("USER_NOT_FOUND", "No account found for this email.", 404);
    throw e;
  }

  return apiOk({ email });
}
