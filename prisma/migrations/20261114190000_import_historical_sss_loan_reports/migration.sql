CREATE TABLE "ImportedSssLoanReport" (
    "sourceReportId" INTEGER NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "sourceEmployerId" INTEGER NOT NULL,
    "employerName" TEXT NOT NULL,
    "employerAddress" TEXT,
    "employerSssNumber" TEXT,
    "prn" TEXT NOT NULL,
    "applicableMonth" INTEGER NOT NULL,
    "applicableYear" INTEGER NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2),
    "paymentType" TEXT,
    "payDate" DATE,
    "sssBranch" TEXT,
    "transactionReference" TEXT,
    "sourceCreatedBy" INTEGER,
    "sourceCreatedAt" TIMESTAMP(3) NOT NULL,
    "sourceUpdatedAt" TIMESTAMP(3) NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportedSssLoanReport_pkey" PRIMARY KEY ("sourceReportId")
);

CREATE TABLE "ImportedSssLoanReportEntry" (
    "sourceEntryId" INTEGER NOT NULL,
    "sourceReportId" INTEGER NOT NULL,
    "sourceEmployeeId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeeSssNumber" TEXT,
    "sourceSssLoanId" INTEGER,
    "loanAccountNumber" TEXT,
    "sourceEmployeeEmployerId" INTEGER,
    "employeeEmployerName" TEXT,
    "salaryRange" TEXT,
    "monthlySalaryCredit" DECIMAL(12,2),
    "employeeSs" DECIMAL(12,2) NOT NULL,
    "employerSs" DECIMAL(12,2) NOT NULL,
    "employeeMpf" DECIMAL(12,2) NOT NULL,
    "employerMpf" DECIMAL(12,2) NOT NULL,
    "ec" DECIMAL(12,2) NOT NULL,
    "loanAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ImportedSssLoanReportEntry_pkey" PRIMARY KEY ("sourceEntryId")
);

CREATE INDEX "ImportedSssLoanReport_sourceEmployerId_applicableYear_applicableMonth_idx"
ON "ImportedSssLoanReport"("sourceEmployerId", "applicableYear", "applicableMonth");

CREATE INDEX "ImportedSssLoanReport_importedAt_idx"
ON "ImportedSssLoanReport"("importedAt");

CREATE INDEX "ImportedSssLoanReportEntry_sourceReportId_idx"
ON "ImportedSssLoanReportEntry"("sourceReportId");

CREATE INDEX "ImportedSssLoanReportEntry_loanAccountNumber_idx"
ON "ImportedSssLoanReportEntry"("loanAccountNumber");

ALTER TABLE "ImportedSssLoanReportEntry"
ADD CONSTRAINT "ImportedSssLoanReportEntry_sourceReportId_fkey"
FOREIGN KEY ("sourceReportId") REFERENCES "ImportedSssLoanReport"("sourceReportId")
ON DELETE CASCADE ON UPDATE CASCADE;
