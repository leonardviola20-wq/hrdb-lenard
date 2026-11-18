ALTER TABLE "LoanMonitorReportEntry"
ADD COLUMN "employerAddress" TEXT;

UPDATE "LoanMonitorReportEntry" AS report_entry
SET "employerAddress" = COALESCE(
  NULLIF(BTRIM(employer."longAddress"), ''),
  NULLIF(BTRIM(employer."shortAddress"), '')
)
FROM "Loan" AS loan
JOIN employee ON employee.id = loan."employeeId"
JOIN employer ON employer.id = employee."employerId"
WHERE report_entry."loanId" = loan.id
  AND report_entry."employerAddress" IS NULL;
