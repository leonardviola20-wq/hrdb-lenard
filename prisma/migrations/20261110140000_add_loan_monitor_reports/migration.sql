-- Add report generation for loans monitoring
CREATE TABLE "LoanMonitorReport" (
    "id" TEXT NOT NULL,
    "applicableDate" DATE NOT NULL,
    "totalMonthly" DECIMAL(14,2) NOT NULL,
    "totalOutstanding" DECIMAL(14,2) NOT NULL,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanMonitorReport_pkey" PRIMARY KEY ("id")
);

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

    CONSTRAINT "LoanMonitorReportEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LoanMonitorReport_applicableDate_idx" ON "LoanMonitorReport"("applicableDate");

CREATE INDEX "LoanMonitorReportEntry_reportId_idx" ON "LoanMonitorReportEntry"("reportId");

ALTER TABLE "LoanMonitorReport" ADD CONSTRAINT "LoanMonitorReport_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LoanMonitorReportEntry" ADD CONSTRAINT "LoanMonitorReportEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "LoanMonitorReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
