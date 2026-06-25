import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import SteamProvider from "next-auth-steam";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
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
    async session({ session, token }) {
      session.user.id = token.sub;
      session.provider = token.provider;
      return session;
    },
    async jwt({ token, account }) {
      if (account) token.provider = account.provider;
      return token;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
