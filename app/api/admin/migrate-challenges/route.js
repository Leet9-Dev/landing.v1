import { prisma } from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api/response";

export async function POST(request) {
  const secret = request.headers.get("x-admin-secret");
  if (secret !== "mig-l9-2026-08-19") {
    return apiError("FORBIDDEN", "Invalid admin secret.", 403);
  }

  const results = [];

  // GameChallenge table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GameChallenge" (
      "id"              TEXT        NOT NULL,
      "challengerId"    TEXT        NOT NULL,
      "challengedId"    TEXT        NOT NULL,
      "gameId"          TEXT        NOT NULL,
      "gameName"        TEXT        NOT NULL,
      "status"          TEXT        NOT NULL DEFAULT 'PENDING',
      "challengerStats" JSONB,
      "challengedStats" JSONB,
      "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GameChallenge_pkey" PRIMARY KEY ("id")
    )
  `);
  results.push("GameChallenge table: OK");

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GameChallenge_challengerId_idx" ON "GameChallenge"("challengerId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GameChallenge_challengedId_idx" ON "GameChallenge"("challengedId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GameChallenge_status_idx" ON "GameChallenge"("status")`);

  // Foreign keys (ignore errors if already exist)
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "GameChallenge" ADD CONSTRAINT "GameChallenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  } catch {}
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "GameChallenge" ADD CONSTRAINT "GameChallenge_challengedId_fkey" FOREIGN KEY ("challengedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  } catch {}
  results.push("GameChallenge indexes + FKs: OK");

  // Notification table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id"        TEXT        NOT NULL,
      "userId"    TEXT        NOT NULL,
      "type"      TEXT        NOT NULL,
      "payload"   JSONB       NOT NULL,
      "read"      BOOLEAN     NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
    )
  `);
  results.push("Notification table: OK");

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read")`);

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  } catch {}
  results.push("Notification indexes + FKs: OK");

  return apiOk({ results });
}
