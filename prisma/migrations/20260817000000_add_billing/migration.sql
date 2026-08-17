-- Add Stripe customer ID to User
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT UNIQUE;

-- Comparison unlock records (one per user per comparison pair)
CREATE TABLE "ComparisonUnlock" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "comparisonKey"   TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "paidAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonUnlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComparisonUnlock_stripeSessionId_key" ON "ComparisonUnlock"("stripeSessionId");
CREATE UNIQUE INDEX "ComparisonUnlock_userId_comparisonKey_key" ON "ComparisonUnlock"("userId", "comparisonKey");
CREATE INDEX "ComparisonUnlock_userId_idx" ON "ComparisonUnlock"("userId");
CREATE INDEX "ComparisonUnlock_comparisonKey_idx" ON "ComparisonUnlock"("comparisonKey");

ALTER TABLE "ComparisonUnlock" ADD CONSTRAINT "ComparisonUnlock_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
