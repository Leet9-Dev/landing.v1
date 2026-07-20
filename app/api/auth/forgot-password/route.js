import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

  // Always return ok — don't reveal whether the email exists
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiOk({ sent: false });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.password) {
    const token = await createPasswordResetToken(email);
    await sendPasswordResetEmail({ to: email, token });
  }

  return apiOk({ sent: true });
}
