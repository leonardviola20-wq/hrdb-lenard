ALTER TABLE "employee"
ADD COLUMN "jobLevel" TEXT,
ADD COLUMN "supervisorId" INTEGER;

CREATE INDEX "employee_supervisorId_idx" ON "employee"("supervisorId");

ALTER TABLE "employee"
ADD CONSTRAINT "employee_supervisorId_fkey"
FOREIGN KEY ("supervisorId") REFERENCES "employee"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
