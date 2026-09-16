import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";

export async function DELETE() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  // Check if Discord is the user's only remaining credential path.
  // Credential paths: any non-Discord OAuth account, a password, or an email (magic link).
  const [otherOAuthCount, user] = await Promise.all([
    prisma.account.count({
      where: { userId, provider: { not: "discord" } },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, password: true },
    }),
  ]);

  if (!user) return apiError("NOT_FOUND", "User not found.", 404);

  const hasOtherOAuth = otherOAuthCount > 0;
  const hasPassword = Boolean(user.password);
  const hasMagicLinkPath = Boolean(user.email); // any email address enables magic link

  if (!hasOtherOAuth && !hasPassword && !hasMagicLinkPath) {
    return apiError(
      "LAST_CREDENTIAL",
      "Discord is your only sign-in method. Add another sign-in method before disconnecting.",
      422
    );
  }

  const deleted = await prisma.account.deleteMany({
    where: { userId, provider: "discord" },
  });

  if (deleted.count === 0) {
    return apiError("NOT_LINKED", "No Discord account is linked to your profile.", 404);
  }

  return apiOk({ unlinked: true });
}
