ALTER TABLE "SssLoan"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "statusReason" TEXT;

ALTER TABLE "SssReportEntry"
ADD COLUMN "sssLoanId" INTEGER,
ADD COLUMN "loanAccountNumber" TEXT;

DROP INDEX "SssReportEntry_reportId_employeeCode_key";

CREATE UNIQUE INDEX "SssReportEntry_reportId_employeeCode_contribution_key"
ON "SssReportEntry"("reportId", "employeeCode")
WHERE "loanAccountNumber" IS NULL;

CREATE UNIQUE INDEX "SssReportEntry_reportId_sssLoanId_key"
ON "SssReportEntry"("reportId", "sssLoanId")
WHERE "sssLoanId" IS NOT NULL;

CREATE INDEX "SssReportEntry_sssLoanId_idx" ON "SssReportEntry"("sssLoanId");

ALTER TABLE "SssReportEntry"
ADD CONSTRAINT "SssReportEntry_sssLoanId_fkey"
FOREIGN KEY ("sssLoanId") REFERENCES "SssLoan"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
