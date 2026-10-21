CREATE TABLE "PagibigEmployeeRecord" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "employerId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "eeShare" DECIMAL(12,2) NOT NULL DEFAULT 200,
    "erShare" DECIMAL(12,2) NOT NULL DEFAULT 200,
    "mp2AccountNo" TEXT,
    "mp2Amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PagibigEmployeeRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PagibigEmployeeLoan" (
    "id" SERIAL NOT NULL,
    "recordId" INTEGER NOT NULL,
    "employerId" INTEGER NOT NULL,
    "loanType" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "loanTermDate" DATE NOT NULL,
    "termYears" INTEGER NOT NULL,
    "termEndDate" DATE NOT NULL,
    "amount" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PagibigEmployeeLoan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PagibigEmployeeRecord_employeeId_employerId_year_key" ON "PagibigEmployeeRecord"("employeeId", "employerId", "year");
CREATE INDEX "PagibigEmployeeRecord_employerId_year_idx" ON "PagibigEmployeeRecord"("employerId", "year");
CREATE UNIQUE INDEX "PagibigEmployeeLoan_recordId_loanType_key" ON "PagibigEmployeeLoan"("recordId", "loanType");
CREATE UNIQUE INDEX "PagibigEmployeeLoan_employerId_loanType_applicationNo_key" ON "PagibigEmployeeLoan"("employerId", "loanType", "applicationNo");
CREATE INDEX "PagibigEmployeeLoan_recordId_idx" ON "PagibigEmployeeLoan"("recordId");
CREATE INDEX "PagibigEmployeeLoan_employerId_loanTermDate_idx" ON "PagibigEmployeeLoan"("employerId", "loanTermDate");

ALTER TABLE "PagibigEmployeeRecord" ADD CONSTRAINT "PagibigEmployeeRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PagibigEmployeeRecord" ADD CONSTRAINT "PagibigEmployeeRecord_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PagibigEmployeeLoan" ADD CONSTRAINT "PagibigEmployeeLoan_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "PagibigEmployeeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PagibigEmployeeLoan" ADD CONSTRAINT "PagibigEmployeeLoan_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
