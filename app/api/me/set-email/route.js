import { requireSession } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const body = await request.json().catch(() => ({}));
  const email = (body.email ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiError("INVALID_EMAIL", "Please enter a valid email address.", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.user.id) {
    return apiError("EMAIL_TAKEN", "That email is already associated with another account.", 409);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email },
  });

  return apiOk({ message: "Email saved." });
}
