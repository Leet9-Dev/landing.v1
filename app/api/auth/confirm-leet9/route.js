import { prisma } from "@/lib/prisma";
import { readLeet9ConfirmToken } from "@/lib/tokens";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function to(path) {
  return NextResponse.redirect(
    new URL(path, process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com")
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return to("/app/settings/account?confirm_error=invalid");
  }

  const email = await readLeet9ConfirmToken(token);

  if (!email) {
    return to("/app/settings/account?confirm_error=expired");
  }

  // Find the user this token belongs to (via User.email or User.pendingEmail).
  const user = await prisma.user.findFirst({
    where: { OR: [{ email }, { pendingEmail: email }] },
    select: { id: true, email: true, pendingEmail: true, leet9Confirmed: true },
  });

  if (!user) {
    return to("/app/settings/account?confirm_error=not_found");
  }

  // Already confirmed — idempotent success (handles prefetch scanners that
  // consume the link before the user clicks).
  if (user.leet9Confirmed) {
    return to("/app/settings/account?email_confirmed=1");
  }

  if (user.pendingEmail === email) {
    // Move pendingEmail → User.email. Uniqueness is enforced here, not at submit.
    const conflict = await prisma.user.findFirst({
      where: { email, NOT: { id: user.id } },
      select: { id: true },
    });
    if (conflict) {
      return to("/app/settings/account?confirm_error=email_taken");
    }
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { email, pendingEmail: null, leet9Confirmed: true },
      });
    } catch (e) {
      // P2002: race condition — another user confirmed the same address first.
      if (e.code === "P2002") {
        return to("/app/settings/account?confirm_error=email_taken");
      }
      throw e;
    }
  } else {
    // Confirm the existing User.email.
    await prisma.user.update({
      where: { id: user.id },
      data: { leet9Confirmed: true },
    });
  }

  return to("/app/settings/account?email_confirmed=1");
}
