CREATE TABLE "PagibigLoan" (
    "id" SERIAL NOT NULL,
    "employerId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "transactionNumber" TEXT,
    "loanType" TEXT NOT NULL,
    "loanDate" DATE NOT NULL,
    "loanAmount" DECIMAL(12,2),
    "monthlyAmortization" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "statusReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PagibigLoan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PagibigReport" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "employerId" INTEGER NOT NULL,
    "employerName" TEXT NOT NULL,
    "employerPagibigNumber" TEXT,
    "pin" TEXT NOT NULL,
    "applicableMonth" INTEGER NOT NULL,
    "applicableYear" INTEGER NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2),
    "paymentType" TEXT,
    "payDate" DATE,
    "transactionReference" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PagibigReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PagibigReportEntry" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "employeeId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeePagibigNumber" TEXT,
    "employeeEmployerId" INTEGER,
    "employeeEmployerName" TEXT,
    "pagibigLoanId" INTEGER,
    "applicationNo" TEXT,
    "memberSavings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "modifiedSavings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "multiPurposeLoan" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "calamityLoan" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "safeLoan" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "loanAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "PagibigReportEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PagibigReportDraft" (
    "id" SERIAL NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "employerId" INTEGER,
    "pin" TEXT NOT NULL DEFAULT '',
    "applicableMonth" INTEGER NOT NULL DEFAULT 1,
    "applicableYear" INTEGER NOT NULL,
    "entries" JSONB NOT NULL,
    "continuedBy" INTEGER,
    "continuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PagibigReportDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PagibigLoan_employerId_applicationNo_key" ON "PagibigLoan"("employerId", "applicationNo");
CREATE INDEX "PagibigLoan_employerId_loanDate_idx" ON "PagibigLoan"("employerId", "loanDate");
CREATE INDEX "PagibigLoan_employeeId_loanDate_idx" ON "PagibigLoan"("employeeId", "loanDate");
CREATE INDEX "PagibigReport_employerId_applicableYear_applicableMonth_idx" ON "PagibigReport"("employerId", "applicableYear", "applicableMonth");
CREATE INDEX "PagibigReport_kind_createdAt_idx" ON "PagibigReport"("kind", "createdAt");
CREATE INDEX "PagibigReportEntry_employeeId_reportId_idx" ON "PagibigReportEntry"("employeeId", "reportId");
CREATE INDEX "PagibigReportEntry_pagibigLoanId_idx" ON "PagibigReportEntry"("pagibigLoanId");
CREATE INDEX "PagibigReportDraft_createdBy_updatedAt_idx" ON "PagibigReportDraft"("createdBy", "updatedAt");
CREATE INDEX "PagibigReportDraft_continuedBy_updatedAt_idx" ON "PagibigReportDraft"("continuedBy", "updatedAt");

ALTER TABLE "PagibigLoan" ADD CONSTRAINT "PagibigLoan_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PagibigLoan" ADD CONSTRAINT "PagibigLoan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PagibigReport" ADD CONSTRAINT "PagibigReport_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PagibigReport" ADD CONSTRAINT "PagibigReport_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PagibigReportEntry" ADD CONSTRAINT "PagibigReportEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "PagibigReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PagibigReportEntry" ADD CONSTRAINT "PagibigReportEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PagibigReportEntry" ADD CONSTRAINT "PagibigReportEntry_pagibigLoanId_fkey" FOREIGN KEY ("pagibigLoanId") REFERENCES "PagibigLoan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PagibigReportDraft" ADD CONSTRAINT "PagibigReportDraft_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
