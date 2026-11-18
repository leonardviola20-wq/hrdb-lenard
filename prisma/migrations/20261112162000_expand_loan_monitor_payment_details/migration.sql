ALTER TABLE "LoanMonitorReport"
ADD COLUMN "amountPaid" DECIMAL(14,2),
ADD COLUMN "paymentBranch" TEXT,
ADD COLUMN "transactionReference" TEXT;

ALTER TABLE "LoanMonitorReportEntry"
ADD COLUMN "employerSssNumber" TEXT;

UPDATE "LoanMonitorReportEntry" AS report_entry
SET "employerSssNumber" = employer.sss
FROM "Loan" AS loan
JOIN employee ON employee.id = loan."employeeId"
JOIN employer ON employer.id = employee."employerId"
WHERE report_entry."loanId" = loan.id
  AND report_entry."employerSssNumber" IS NULL;
