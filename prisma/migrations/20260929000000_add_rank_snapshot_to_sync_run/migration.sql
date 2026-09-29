-- Add rank snapshot fields to PlatformSyncRun for share card delta tracking
ALTER TABLE "PlatformSyncRun" ADD COLUMN "l9PointsBefore" DOUBLE PRECISION;
ALTER TABLE "PlatformSyncRun" ADD COLUMN "l9PointsAfter" DOUBLE PRECISION;
ALTER TABLE "PlatformSyncRun" ADD COLUMN "rankBefore" INTEGER;
ALTER TABLE "PlatformSyncRun" ADD COLUMN "rankAfter" INTEGER;
