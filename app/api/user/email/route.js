import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { createLeet9ConfirmToken } from "@/lib/tokens";
import { sendLeet9ConfirmationEmail } from "@/lib/email";
import { apiOk, apiError } from "@/lib/api/response";

export async function PATCH(request) {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_BODY", "Invalid JSON.", 400);
  }

  const email =
    typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiError("INVALID_EMAIL", "Enter a valid email address.", 400);
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { leet9Confirmed: true },
  });
  if (!user) return apiError("NOT_FOUND", "User not found.", 404);
  if (user.leet9Confirmed) return apiOk({ sent: false });

  // Write to pendingEmail only — never to User.email before confirmation.
  // Uniqueness is enforced at confirm time, not here: always respond the same
  // way regardless of whether the address is already in use.
  await prisma.user.update({
    where: { id: userId },
    data: { pendingEmail: email },
  });

  // Fire confirmation email in the background; don't fail the request if
  // the send errors (the user can retry via the Resend button in the banner).
  createLeet9ConfirmToken(email, { force: true })
    .then(token => sendLeet9ConfirmationEmail({ to: email, token }))
    .catch(err => console.error("[user/email PATCH]", err));

  return apiOk({ sent: true });
}
