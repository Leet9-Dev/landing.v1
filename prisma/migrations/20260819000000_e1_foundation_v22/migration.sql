-- E1 Foundation — Gamification Engine v2.2 schema additions
-- Additive only; v1 tables (PointsLedger, GamificationEvent, …) are unchanged
-- until the E3 cutover migration.

-- XpLedger: dual-currency audit trail (XP + SP)
CREATE TABLE "XpLedger" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "ruleId"         TEXT,
    "eventId"        TEXT,
    "xpDelta"        INTEGER NOT NULL,
    "spDelta"        INTEGER NOT NULL DEFAULT 0,
    "seasonId"       INTEGER NOT NULL DEFAULT 0,
    "source"         TEXT NOT NULL DEFAULT 'rule',
    "idempotencyKey" TEXT NOT NULL,
    "reversalOf"     TEXT,
    "awardedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note"           TEXT,

    CONSTRAINT "XpLedger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "XpLedger_idempotencyKey_key" ON "XpLedger"("idempotencyKey");
CREATE INDEX "XpLedger_userId_idx"    ON "XpLedger"("userId");
CREATE INDEX "XpLedger_seasonId_idx"  ON "XpLedger"("seasonId");
CREATE INDEX "XpLedger_awardedAt_idx" ON "XpLedger"("awardedAt");
CREATE INDEX "XpLedger_ruleId_idx"    ON "XpLedger"("ruleId");

ALTER TABLE "XpLedger"
    ADD CONSTRAINT "XpLedger_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DailyCounter: per-user per-day cap enforcement
CREATE TABLE "DailyCounter" (
    "userId"     TEXT NOT NULL,
    "date"       TEXT NOT NULL,
    "counterKey" TEXT NOT NULL,
    "count"      INTEGER NOT NULL DEFAULT 0,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCounter_pkey" PRIMARY KEY ("userId", "date", "counterKey")
);

CREATE INDEX "DailyCounter_userId_idx" ON "DailyCounter"("userId");

ALTER TABLE "DailyCounter"
    ADD CONSTRAINT "DailyCounter_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GamificationConfig: hot-reloadable §19 key-value config
CREATE TABLE "GamificationConfig" (
    "key"         TEXT NOT NULL,
    "value"       TEXT NOT NULL,
    "description" TEXT,
    "updatedBy"   TEXT,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamificationConfig_pkey" PRIMARY KEY ("key")
);

-- LevelCurve: (level → cumulativeXp) snapshot generated at boot
CREATE TABLE "LevelCurve" (
    "level"        INTEGER NOT NULL,
    "cumulativeXp" INTEGER NOT NULL,
    "stepXp"       INTEGER NOT NULL,

    CONSTRAINT "LevelCurve_pkey" PRIMARY KEY ("level")
);

-- Season: season metadata; id=0 = Preseason
CREATE TABLE "Season" (
    "id"        INTEGER NOT NULL,
    "name"      TEXT NOT NULL,
    "startsAt"  TIMESTAMP(3),
    "endsAt"    TIMESTAMP(3),
    "isActive"  BOOLEAN NOT NULL DEFAULT false,
    "metadata"  JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- SeasonScore: running SP total per user per season
CREATE TABLE "SeasonScore" (
    "userId"        TEXT NOT NULL,
    "seasonId"      INTEGER NOT NULL,
    "spTotal"       INTEGER NOT NULL DEFAULT 0,
    "tier"          TEXT NOT NULL DEFAULT 'bronze',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonScore_pkey" PRIMARY KEY ("userId", "seasonId")
);

CREATE INDEX "SeasonScore_seasonId_spTotal_idx" ON "SeasonScore"("seasonId", "spTotal");
CREATE INDEX "SeasonScore_userId_idx"           ON "SeasonScore"("userId");

ALTER TABLE "SeasonScore"
    ADD CONSTRAINT "SeasonScore_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SeasonScore"
    ADD CONSTRAINT "SeasonScore_seasonId_fkey"
    FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON UPDATE CASCADE;

-- Seed Season 0 (Preseason) so foreign-key constraints on SeasonScore are satisfied
INSERT INTO "Season" ("id", "name", "isActive") VALUES (0, 'Preseason', true);
