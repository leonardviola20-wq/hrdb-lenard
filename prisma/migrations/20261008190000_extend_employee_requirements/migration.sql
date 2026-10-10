CREATE TABLE "EmployeeRequirementAttachment" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "requirementKey" TEXT NOT NULL,
    "employeeRequirementId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeRequirementAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmployeeBdoAccountNumber" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeBdoAccountNumber_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmployeeRequirementAttachment_employeeId_requirementKey_idx"
ON "EmployeeRequirementAttachment"("employeeId", "requirementKey");

CREATE INDEX "EmployeeRequirementAttachment_employeeRequirementId_idx"
ON "EmployeeRequirementAttachment"("employeeRequirementId");

CREATE UNIQUE INDEX "EmployeeBdoAccountNumber_employeeId_accountNumber_key"
ON "EmployeeBdoAccountNumber"("employeeId", "accountNumber");

CREATE INDEX "EmployeeBdoAccountNumber_employeeId_idx"
ON "EmployeeBdoAccountNumber"("employeeId");

ALTER TABLE "EmployeeRequirementAttachment"
ADD CONSTRAINT "EmployeeRequirementAttachment_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "employee"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeRequirementAttachment"
ADD CONSTRAINT "EmployeeRequirementAttachment_employeeRequirementId_fkey"
FOREIGN KEY ("employeeRequirementId") REFERENCES "EmployeeRequirement"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeBdoAccountNumber"
ADD CONSTRAINT "EmployeeBdoAccountNumber_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "employee"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
