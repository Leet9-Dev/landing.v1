import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import SteamProvider from "next-auth-steam";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import bcrypt from "bcryptjs";

const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  }),
  CredentialsProvider({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, req) {
      if (!credentials?.email || !credentials?.password) return null;
      const ip = req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ?? "unknown";
      const { success } = await checkRateLimit("auth", ip);
      if (!success) throw new Error("RATE_LIMITED");
      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase().trim() },
      });
      if (!user?.password) return null;
      const valid = await bcrypt.compare(credentials.password, user.password);
      if (!valid) return null;
      if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");
      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
];

// Steam requires a valid API key — skip at build time if not set
if (process.env.STEAM_SECRET && !process.env.STEAM_SECRET.startsWith("INCOLLA")) {
  providers.push(
    SteamProvider(
      {
        nextAuthUrl: process.env.NEXTAUTH_URL,
        secret: process.env.NEXTAUTH_SECRET,
      },
      {
        async profile(profile) {
          return {
            id: profile.steamid,
            name: profile.personaname,
            email: null,
            image: profile.avatarfull,
          };
        },
      }
    )
  );
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Auto-connect Steam PlatformAccount on every Steam OAuth login.
    // user.id is the Prisma User.id (set by the adapter before this callback).
    // Never blocks sign-in: if the upsert fails we log and continue.
    async signIn({ user, account }) {
      if (account?.provider === "steam" && account.providerAccountId && user?.id) {
        try {
          await prisma.platformAccount.upsert({
            where: { userId_provider: { userId: user.id, provider: "steam" } },
            create: {
              userId: user.id,
              provider: "steam",
              externalUserId: account.providerAccountId,
              username: user.name ?? null,
              displayName: user.name ?? null,
              status: "connected",
              syncStatus: "idle",
              connectedAt: new Date(),
              capabilities: { gameLibrary: true, achievements: true, trophies: false, playtime: true },
              metadata: { connectedVia: "oauth_steam" },
            },
            update: {
              externalUserId: account.providerAccountId,
              username: user.name ?? null,
              displayName: user.name ?? null,
              status: "connected",
              connectedAt: new Date(),
              disconnectedAt: null,
              needsReauthAt: null,
              metadata: { connectedVia: "oauth_steam" },
            },
          });
        } catch (e) {
          console.error("[auth] Steam PlatformAccount auto-connect failed:", e.message);
        }
      }
      return true;
    },

    async session({ session, token }) {
      session.user.id = token.sub;
      session.provider = token.provider;
      if (token.steamId64) session.user.steamId64 = token.steamId64;
      return session;
    },

    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
        if (account.provider === "steam") token.steamId64 = account.providerAccountId;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
