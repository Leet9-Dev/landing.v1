-- CreateTable
CREATE TABLE "OneVsOneLead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "p1Input" TEXT NOT NULL,
    "p2Input" TEXT NOT NULL,
    "winnerName" TEXT,
    "l9Score1" INTEGER,
    "l9Score2" INTEGER,
    "refToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OneVsOneLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OneVsOneLead_email_idx" ON "OneVsOneLead"("email");
