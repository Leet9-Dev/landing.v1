-- E4 Sprint Challenges — additive columns on GameChallenge
-- Status vocabulary extended: PENDING | ACTIVE | COMPLETED | DRAW | DECLINED | EXPIRED
-- (ACCEPTED kept as alias in legacy data; new sprints go PENDING → ACTIVE)

ALTER TABLE "GameChallenge"
    ADD COLUMN IF NOT EXISTS "sprintDuration"     TEXT    NOT NULL DEFAULT '72h',
    ADD COLUMN IF NOT EXISTS "sprintStat"         TEXT    NOT NULL DEFAULT 'hours',
    ADD COLUMN IF NOT EXISTS "acceptedAt"         TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "expiresAt"          TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "resolvedAt"         TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "challengerBaseline" JSONB,
    ADD COLUMN IF NOT EXISTS "challengedBaseline" JSONB,
    ADD COLUMN IF NOT EXISTS "challengerDelta"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "challengedDelta"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "winnerId"           TEXT;

CREATE INDEX IF NOT EXISTS "GameChallenge_expiresAt_idx" ON "GameChallenge"("expiresAt");
CREATE INDEX IF NOT EXISTS "GameChallenge_winnerId_idx"  ON "GameChallenge"("winnerId");
