ALTER TABLE "OfficeContact"
ADD COLUMN "employeeId" INTEGER;

CREATE INDEX "OfficeContact_employeeId_idx"
ON "OfficeContact"("employeeId");

ALTER TABLE "OfficeContact"
ADD CONSTRAINT "OfficeContact_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "employee"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
