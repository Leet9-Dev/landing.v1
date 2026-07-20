import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { consumePasswordResetToken } from "@/lib/tokens";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (password.length < 8) {
    return apiError("WEAK_PASSWORD", "Password must be at least 8 characters.", 400);
  }

  const email = await consumePasswordResetToken(token);
  if (!email) return apiError("INVALID_TOKEN", "This link is invalid or has expired.", 400);

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { email }, data: { password: hashed } });

  return apiOk({ email });
}
