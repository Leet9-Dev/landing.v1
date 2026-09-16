-- AlterTable: email state model (Stories 5 & 6)
ALTER TABLE "User" ADD COLUMN "leet9Confirmed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "leet9ConfirmSentCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill: mark users who have already proven email ownership as confirmed.
-- Covers: credentials users (have a password), users who completed email
-- verification, and Google OAuth users. Discord-only users stay false.
UPDATE "User" u
SET "leet9Confirmed" = true
WHERE u.password IS NOT NULL
   OR u."emailVerified" IS NOT NULL
   OR EXISTS (
     SELECT 1 FROM "Account" a
     WHERE a."userId" = u.id AND a.provider = 'google'
   );
