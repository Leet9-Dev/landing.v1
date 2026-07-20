-- AddColumn: User.password (nullable, for email/password auth)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;
