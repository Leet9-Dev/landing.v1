import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 32) : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiError("INVALID_EMAIL", "Enter a valid email address.", 400);
  }
  if (password.length < 8) {
    return apiError("WEAK_PASSWORD", "Password must be at least 8 characters.", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("EMAIL_TAKEN", "An account with this email already exists.", 409);
  }

  const hashed = await bcrypt.hash(password, 12);
  const isPreview = process.env.VERCEL_ENV === "preview";

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashed,
        emailVerified: isPreview ? new Date() : null,
      },
    });
  } catch (err) {
    console.error("[register] prisma.user.create failed:", err);
    return apiError("DB_ERROR", "Could not create account. Please try again.", 500);
  }

  if (!isPreview) {
    try {
      const token = await createVerificationToken(email);
      await sendVerificationEmail({ to: email, token });
    } catch (err) {
      console.error("[register] email send failed:", err);
      // Non-fatal: account created, email failed
    }
  }

  return apiOk({ id: user.id, email: user.email, name: user.name, emailPending: !isPreview });
}
