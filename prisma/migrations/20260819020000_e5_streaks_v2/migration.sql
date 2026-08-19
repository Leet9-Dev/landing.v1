-- E5 Streaks v2 — freeze token support on UserStreak

ALTER TABLE "UserStreak"
    ADD COLUMN IF NOT EXISTS "freezeTokens"    INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "lastFreezeUsedAt" TIMESTAMP(3);
