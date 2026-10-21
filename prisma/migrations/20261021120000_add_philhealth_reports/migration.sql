CREATE TABLE "PhilHealthEmployeeRecord" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "employerId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhilHealthEmployeeRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhilHealthReport" (
    "id" SERIAL NOT NULL,
    "employerId" INTEGER NOT NULL,
    "employerName" TEXT NOT NULL,
    "employerPhicNumber" TEXT,
    "applicableMonth" INTEGER NOT NULL,
    "applicableYear" INTEGER NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhilHealthReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhilHealthReportEntry" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "employeeId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeePhilHealthNumber" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PhilHealthReportEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhilHealthPayment" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "payorName" TEXT NOT NULL,
    "pen" TEXT NOT NULL,
    "spa" TEXT,
    "applicablePeriod" TEXT NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "accreditedCollectingAgent" TEXT,
    "transactionConfirmationNumber" TEXT,
    "transactionDate" DATE NOT NULL,
    "eparNumber" TEXT,
    "eparDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhilHealthPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PhilHealthEmployeeRecord_employeeId_employerId_key" ON "PhilHealthEmployeeRecord"("employeeId", "employerId");
CREATE INDEX "PhilHealthEmployeeRecord_employerId_active_idx" ON "PhilHealthEmployeeRecord"("employerId", "active");
CREATE UNIQUE INDEX "PhilHealthReport_employerId_applicableYear_applicableMonth_key" ON "PhilHealthReport"("employerId", "applicableYear", "applicableMonth");
CREATE INDEX "PhilHealthReport_employerId_applicableYear_applicableMonth_idx" ON "PhilHealthReport"("employerId", "applicableYear", "applicableMonth");
CREATE INDEX "PhilHealthReportEntry_reportId_employeeName_idx" ON "PhilHealthReportEntry"("reportId", "employeeName");
CREATE INDEX "PhilHealthReportEntry_employeeId_idx" ON "PhilHealthReportEntry"("employeeId");
CREATE UNIQUE INDEX "PhilHealthPayment_reportId_key" ON "PhilHealthPayment"("reportId");
CREATE INDEX "PhilHealthPayment_transactionDate_idx" ON "PhilHealthPayment"("transactionDate");

ALTER TABLE "PhilHealthEmployeeRecord" ADD CONSTRAINT "PhilHealthEmployeeRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhilHealthEmployeeRecord" ADD CONSTRAINT "PhilHealthEmployeeRecord_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhilHealthReport" ADD CONSTRAINT "PhilHealthReport_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhilHealthReport" ADD CONSTRAINT "PhilHealthReport_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PhilHealthReportEntry" ADD CONSTRAINT "PhilHealthReportEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "PhilHealthReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhilHealthReportEntry" ADD CONSTRAINT "PhilHealthReportEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PhilHealthPayment" ADD CONSTRAINT "PhilHealthPayment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "PhilHealthReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
