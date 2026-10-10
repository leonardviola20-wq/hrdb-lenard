CREATE TABLE "SssLoan" (
    "id" SERIAL NOT NULL,
    "employerId" INTEGER NOT NULL,
    "employeeId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "biometricNo" TEXT NOT NULL,
    "loanAccountNumber" TEXT NOT NULL,
    "loanDate" DATE NOT NULL,
    "firstDeductionDate" DATE NOT NULL,
    "loanAmount" DECIMAL(12,2) NOT NULL,
    "monthlyAmortization" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SssLoan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SssLoan_employerId_firstDeductionDate_idx" ON "SssLoan"("employerId", "firstDeductionDate");
CREATE INDEX "SssLoan_employeeId_loanDate_idx" ON "SssLoan"("employeeId", "loanDate");

ALTER TABLE "SssLoan" ADD CONSTRAINT "SssLoan_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SssLoan" ADD CONSTRAINT "SssLoan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
