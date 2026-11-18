-- CreateEnum
CREATE TYPE "LoanProvider" AS ENUM ('SSS', 'PAGIBIG');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "SssReport" (
    "id" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "employerId" INTEGER NOT NULL,
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
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SssReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SssReportEntry" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "employeeId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeeSssNumber" TEXT,
    "sssLoanId" INTEGER,
    "loanAccountNumber" TEXT,
    "employeeEmployerId" INTEGER,
    "employeeEmployerName" TEXT,
    "salaryRange" TEXT,
    "monthlySalaryCredit" DECIMAL(12,2),
    "employeeSs" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "employerSs" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "employeeMpf" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "employerMpf" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ec" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "loanAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SssReportEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SssReportDraft" (
    "id" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "employerId" INTEGER,
    "prn" TEXT NOT NULL DEFAULT '',
    "applicableMonth" INTEGER NOT NULL DEFAULT 1,
    "applicableYear" INTEGER NOT NULL,
    "amountDue" TEXT NOT NULL DEFAULT '',
    "entries" JSONB NOT NULL,
    "continuedBy" INTEGER,
    "continuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SssReportDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SssLoan" (
    "id" SERIAL NOT NULL,
    "employerId" INTEGER NOT NULL,
    "employeeId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "biometricNo" TEXT NOT NULL,
    "loanAccountNumber" TEXT NOT NULL,
    "transactionNumber" TEXT,
    "loanType" TEXT NOT NULL DEFAULT 'S',
    "loanDate" DATE NOT NULL,
    "loanAmount" DECIMAL(12,2),
    "monthlyAmortization" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "statusReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SssLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER,
    "provider" "LoanProvider" NOT NULL,
    "loanType" TEXT NOT NULL,
    "loanAccountNumber" TEXT NOT NULL,
    "loanDate" DATE,
    "terms" INTEGER,
    "statusReason" TEXT,
    "totalAmount" DECIMAL(12,2),
    "monthlyAmortization" DECIMAL(12,2) NOT NULL,
    "outstandingBalance" DECIMAL(12,2),
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanPayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL_ENTRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanMonitorReport" (
    "id" TEXT NOT NULL,
    "applicableDate" DATE NOT NULL,
    "employerName" TEXT,
    "employerSssNumber" TEXT,
    "employerAddress" TEXT,
    "totalMonthly" DECIMAL(14,2) NOT NULL,
    "totalOutstanding" DECIMAL(14,2) NOT NULL,
    "prn" TEXT,
    "paymentDate" DATE,
    "amountPaid" DECIMAL(14,2),
    "paymentBranch" TEXT,
    "transactionReference" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanMonitorReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanMonitorReportEntry" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "loanType" TEXT NOT NULL,
    "loanAccountNumber" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "loanDate" DATE,
    "terms" INTEGER,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "monthlyAmortization" DECIMAL(12,2) NOT NULL,
    "outstandingBalance" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,
    "statusReason" TEXT,
    "employerName" TEXT NOT NULL,
    "employerSssNumber" TEXT,
    "employerAddress" TEXT,

    CONSTRAINT "LoanMonitorReportEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE INDEX "SssReport_employerId_applicableYear_applicableMonth_idx" ON "SssReport"("employerId", "applicableYear", "applicableMonth");

-- CreateIndex
CREATE INDEX "SssReport_kind_createdAt_idx" ON "SssReport"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "SssReportEntry_employeeId_reportId_idx" ON "SssReportEntry"("employeeId", "reportId");

-- CreateIndex
CREATE INDEX "SssReportEntry_sssLoanId_idx" ON "SssReportEntry"("sssLoanId");

-- CreateIndex
CREATE INDEX "SssReportDraft_createdBy_updatedAt_idx" ON "SssReportDraft"("createdBy", "updatedAt");

-- CreateIndex
CREATE INDEX "SssReportDraft_continuedBy_updatedAt_idx" ON "SssReportDraft"("continuedBy", "updatedAt");

-- CreateIndex
CREATE INDEX "SssLoan_employerId_loanDate_idx" ON "SssLoan"("employerId", "loanDate");

-- CreateIndex
CREATE INDEX "SssLoan_employeeId_loanDate_idx" ON "SssLoan"("employeeId", "loanDate");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_loanAccountNumber_key" ON "Loan"("loanAccountNumber");

-- CreateIndex
CREATE INDEX "Loan_employeeId_idx" ON "Loan"("employeeId");

-- CreateIndex
CREATE INDEX "Loan_provider_status_idx" ON "Loan"("provider", "status");

-- CreateIndex
CREATE INDEX "LoanPayment_loanId_paymentDate_idx" ON "LoanPayment"("loanId", "paymentDate");

-- CreateIndex
CREATE INDEX "LoanMonitorReport_applicableDate_idx" ON "LoanMonitorReport"("applicableDate");

-- CreateIndex
CREATE INDEX "LoanMonitorReportEntry_reportId_idx" ON "LoanMonitorReportEntry"("reportId");

-- CreateIndex
CREATE INDEX "ImportedSssLoanReport_sourceEmployerId_applicableYear_appli_idx" ON "ImportedSssLoanReport"("sourceEmployerId", "applicableYear", "applicableMonth");

-- CreateIndex
CREATE INDEX "ImportedSssLoanReport_importedAt_idx" ON "ImportedSssLoanReport"("importedAt");

-- CreateIndex
CREATE INDEX "ImportedSssLoanReportEntry_sourceReportId_idx" ON "ImportedSssLoanReportEntry"("sourceReportId");

-- CreateIndex
CREATE INDEX "ImportedSssLoanReportEntry_loanAccountNumber_idx" ON "ImportedSssLoanReportEntry"("loanAccountNumber");

-- AddForeignKey
ALTER TABLE "SssReportEntry" ADD CONSTRAINT "SssReportEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "SssReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SssReportEntry" ADD CONSTRAINT "SssReportEntry_sssLoanId_fkey" FOREIGN KEY ("sssLoanId") REFERENCES "SssLoan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanMonitorReportEntry" ADD CONSTRAINT "LoanMonitorReportEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "LoanMonitorReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportedSssLoanReportEntry" ADD CONSTRAINT "ImportedSssLoanReportEntry_sourceReportId_fkey" FOREIGN KEY ("sourceReportId") REFERENCES "ImportedSssLoanReport"("sourceReportId") ON DELETE CASCADE ON UPDATE CASCADE;

