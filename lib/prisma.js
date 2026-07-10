// Shared Prisma client singleton for server-side route handlers.
//
// PrismaClient is instantiated lazily and reused across hot reloads via
// globalThis, to avoid exhausting database connections in development. The
// constructor does NOT open a connection — the first query does — so importing
// this module is safe at build time (no DB access required to compile).
//
// This client is used by the Phase 16 PlatformAccount write path. NextAuth keeps
// its own adapter client in lib/auth.js (unchanged).
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
