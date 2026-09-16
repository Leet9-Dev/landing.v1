import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { createLeet9ConfirmToken } from "@/lib/tokens";
import { sendLeet9ConfirmationEmail } from "@/lib/email";
import { apiOk, apiError } from "@/lib/api/response";

export async function POST() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, pendingEmail: true, leet9Confirmed: true },
  });

  if (!user) return apiError("NOT_FOUND", "User not found.", 404);
  if (user.leet9Confirmed) return apiOk({ sent: false, reason: "already_confirmed" });

  // Prefer pendingEmail (user just added an address) over the existing email.
  const emailToConfirm = user.pendingEmail ?? user.email;
  if (!emailToConfirm) return apiError("NO_EMAIL", "No email address to confirm.", 400);

  try {
    // force=true: manual resend always creates a fresh 24h token.
    const token = await createLeet9ConfirmToken(emailToConfirm, { force: true });
    await sendLeet9ConfirmationEmail({ to: emailToConfirm, token });
  } catch (err) {
    console.error("[send-confirmation]", err);
    return apiError("SEND_FAILED", "Could not send confirmation email. Please try again.", 500);
  }

  return apiOk({ sent: true });
}
