-- =====================================================================
-- DRAFT migration — Phase 10 platform sync persistence (NOT APPLIED)
-- =====================================================================
--
-- ⚠️  THIS IS A DRAFT ARTIFACT. IT HAS NOT BEEN APPLIED TO ANY DATABASE.
--
-- Location is intentional: this file lives in `prisma/migrations-draft/`,
-- NOT `prisma/migrations/`. Prisma's migrate engine ignores this folder, so
-- this SQL can NEVER be auto-applied by `prisma migrate deploy`.
--
-- How it was generated (offline, no database connection):
--   prisma migrate diff \
--     --from-schema-datamodel <pre-Phase-10 NextAuth-only schema> \
--     --to-schema-datamodel prisma/schema.prisma \
--     --script
--
-- It therefore contains ONLY the Phase 10 additions (5 new tables), which is
-- correct for the current Neon database that already has the NextAuth tables
-- (Account, Session, User, VerificationToken).
--
-- DO NOT run this against production. See docs/DB_MIGRATION_SAFETY.md and
-- docs/MIGRATION_READINESS_CHECKLIST.md. A real, tracked Prisma migration must
-- be generated against a dev/staging database in a future phase (Phase 12) and
-- applied to production only through the reviewed, approved deploy process.
-- =====================================================================

-- CreateTable
CREATE TABLE "PlatformAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalUserId" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "syncStatus" TEXT NOT NULL DEFAULT 'idle',
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "needsReauthAt" TIMESTAMP(3),
    "capabilities" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSyncRun" (
    "id" TEXT NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'dry_run',
    "status" TEXT NOT NULL DEFAULT 'idle',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "rawGamesDetected" INTEGER NOT NULL DEFAULT 0,
    "matchedCanonicalGames" INTEGER NOT NULL DEFAULT 0,
    "unmatchedGames" INTEGER NOT NULL DEFAULT 0,
    "userGamesToCreate" INTEGER NOT NULL DEFAULT 0,
    "userGamesToUpdate" INTEGER NOT NULL DEFAULT 0,
    "warnings" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformDetectedGame" (
    "id" TEXT NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "syncRunId" TEXT,
    "provider" TEXT NOT NULL,
    "externalGameId" TEXT NOT NULL,
    "externalTitle" TEXT,
    "playtimeHours" DOUBLE PRECISION,
    "achievementsUnlocked" INTEGER,
    "trophiesUnlocked" INTEGER,
    "lastPlayedAt" TIMESTAMP(3),
    "canonicalGameId" TEXT,
    "matchStatus" TEXT NOT NULL DEFAULT 'unmatched',
    "raw" JSONB,
    "normalized" JSONB,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformDetectedGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameExternalSource" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalGameId" TEXT NOT NULL,
    "externalTitle" TEXT,
    "canonicalGameId" TEXT NOT NULL,
    "confidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameExternalSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGame" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canonicalGameId" TEXT NOT NULL,
    "sourceProvider" TEXT,
    "sourcePlatformAccountId" TEXT,
    "firstDetectedAt" TIMESTAMP(3),
    "lastDetectedAt" TIMESTAMP(3),
    "playtimeHours" DOUBLE PRECISION,
    "achievementsUnlocked" INTEGER,
    "trophiesUnlocked" INTEGER,
    "sourceConfidence" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformAccount_provider_idx" ON "PlatformAccount"("provider");

-- CreateIndex
CREATE INDEX "PlatformAccount_status_idx" ON "PlatformAccount"("status");

-- CreateIndex
CREATE INDEX "PlatformAccount_syncStatus_idx" ON "PlatformAccount"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccount_userId_provider_key" ON "PlatformAccount"("userId", "provider");

-- CreateIndex
CREATE INDEX "PlatformSyncRun_provider_idx" ON "PlatformSyncRun"("provider");

-- CreateIndex
CREATE INDEX "PlatformSyncRun_status_idx" ON "PlatformSyncRun"("status");

-- CreateIndex
CREATE INDEX "PlatformSyncRun_startedAt_idx" ON "PlatformSyncRun"("startedAt");

-- CreateIndex
CREATE INDEX "PlatformDetectedGame_provider_idx" ON "PlatformDetectedGame"("provider");

-- CreateIndex
CREATE INDEX "PlatformDetectedGame_canonicalGameId_idx" ON "PlatformDetectedGame"("canonicalGameId");

-- CreateIndex
CREATE INDEX "PlatformDetectedGame_matchStatus_idx" ON "PlatformDetectedGame"("matchStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformDetectedGame_platformAccountId_provider_externalGam_key" ON "PlatformDetectedGame"("platformAccountId", "provider", "externalGameId");

-- CreateIndex
CREATE INDEX "GameExternalSource_canonicalGameId_idx" ON "GameExternalSource"("canonicalGameId");

-- CreateIndex
CREATE INDEX "GameExternalSource_status_idx" ON "GameExternalSource"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GameExternalSource_provider_externalGameId_key" ON "GameExternalSource"("provider", "externalGameId");

-- CreateIndex
CREATE INDEX "UserGame_canonicalGameId_idx" ON "UserGame"("canonicalGameId");

-- CreateIndex
CREATE INDEX "UserGame_sourceProvider_idx" ON "UserGame"("sourceProvider");

-- CreateIndex
CREATE UNIQUE INDEX "UserGame_userId_canonicalGameId_key" ON "UserGame"("userId", "canonicalGameId");

-- AddForeignKey
ALTER TABLE "PlatformAccount" ADD CONSTRAINT "PlatformAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSyncRun" ADD CONSTRAINT "PlatformSyncRun_platformAccountId_fkey" FOREIGN KEY ("platformAccountId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformDetectedGame" ADD CONSTRAINT "PlatformDetectedGame_platformAccountId_fkey" FOREIGN KEY ("platformAccountId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformDetectedGame" ADD CONSTRAINT "PlatformDetectedGame_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "PlatformSyncRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

