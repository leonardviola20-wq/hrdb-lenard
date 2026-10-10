DROP INDEX IF EXISTS "SssLoan_employerId_firstDeductionDate_idx";

ALTER TABLE "SssLoan" DROP COLUMN "firstDeductionDate";

CREATE INDEX "SssLoan_employerId_loanDate_idx" ON "SssLoan"("employerId", "loanDate");
