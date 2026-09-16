import { requireSession } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api/response";

export async function GET() {
  const { session, unauthenticated } = await requireSession();
  if (unauthenticated) return unauthenticated;

  const userId = session.user.id;

  const [accounts, user] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      select: { provider: true, providerAccountId: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, password: true, name: true, leet9Confirmed: true, pendingEmail: true },
    }),
  ]);

  const googleAccount = accounts.find(a => a.provider === "google");
  const discordAccount = accounts.find(a => a.provider === "discord");

  // For Discord display name, pull from PlatformAccount if available.
  let discordDisplayName = null;
  if (discordAccount) {
    const pa = await prisma.platformAccount.findFirst({
      where: { userId, provider: "discord" },
      select: { displayName: true, username: true },
    }).catch(() => null);
    discordDisplayName = pa?.displayName ?? pa?.username ?? user?.name ?? discordAccount.providerAccountId;
  }

  return apiOk({
    google: googleAccount ? (user?.email ?? googleAccount.providerAccountId) : null,
    discord: discordDisplayName,
    hasPassword: Boolean(user?.password),
    hasEmail: Boolean(user?.email),
    leet9Confirmed: Boolean(user?.leet9Confirmed),
    email: user?.email ?? null,
    pendingEmail: user?.pendingEmail ?? null,
  });
}
