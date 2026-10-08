CREATE TABLE "EmployeeRequirement" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "requirementKey" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeRequirement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmployeeRequirement_employeeId_requirementKey_key"
ON "EmployeeRequirement"("employeeId", "requirementKey");

CREATE INDEX "EmployeeRequirement_employeeId_isComplete_idx"
ON "EmployeeRequirement"("employeeId", "isComplete");

ALTER TABLE "EmployeeRequirement"
ADD CONSTRAINT "EmployeeRequirement_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "employee"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
