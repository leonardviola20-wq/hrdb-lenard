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

-- AddForeignKey
ALTER TABLE "SssReportEntry" ADD CONSTRAINT "SssReportEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "SssReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

