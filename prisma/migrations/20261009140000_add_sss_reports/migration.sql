CREATE TABLE "SssReport" (
    "id" SERIAL NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SssReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SssReportEntry" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "employeeId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
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

CREATE INDEX "SssReport_employerId_applicableYear_applicableMonth_idx" ON "SssReport"("employerId", "applicableYear", "applicableMonth");
CREATE INDEX "SssReport_kind_createdAt_idx" ON "SssReport"("kind", "createdAt");
CREATE UNIQUE INDEX "SssReportEntry_reportId_employeeCode_key" ON "SssReportEntry"("reportId", "employeeCode");
CREATE INDEX "SssReportEntry_employeeId_reportId_idx" ON "SssReportEntry"("employeeId", "reportId");

ALTER TABLE "SssReport" ADD CONSTRAINT "SssReport_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SssReportEntry" ADD CONSTRAINT "SssReportEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "SssReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SssReportEntry" ADD CONSTRAINT "SssReportEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
