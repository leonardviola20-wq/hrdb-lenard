ALTER TABLE "User"
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "verificationTokenHash" TEXT,
ADD COLUMN "verificationTokenExpires" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_verificationTokenHash_key" ON "User"("verificationTokenHash");
