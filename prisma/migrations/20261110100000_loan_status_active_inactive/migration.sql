-- Rename LoanStatus values: ACTIVE stays ACTIVE; others fold into INACTIVE with a reason.
ALTER TABLE "Loan" ADD COLUMN "statusReason" TEXT;
ALTER TABLE "Loan" ADD COLUMN "loanDate" DATE;
ALTER TABLE "Loan" ADD COLUMN "terms" INTEGER;

-- Backfill reasons from the old statuses before the type change.
UPDATE "Loan" SET "statusReason" = CASE
  WHEN "status" = 'FULLY_PAID' THEN 'fully paid'
  WHEN "status" = 'ON_HOLD' THEN 'on hold'
  ELSE 'pending verification'
END
WHERE "status" <> 'ACTIVE';

CREATE TYPE "LoanStatus_new" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "Loan" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Loan" ALTER COLUMN "status" TYPE "LoanStatus_new" USING (
  CASE WHEN "status" = 'ACTIVE' THEN 'ACTIVE' ELSE 'INACTIVE' END::"LoanStatus_new"
);
ALTER TABLE "Loan" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
DROP TYPE "LoanStatus";
ALTER TYPE "LoanStatus_new" RENAME TO "LoanStatus";
