heck how the ALTER TABLE "SssReport"
ADD COLUMN "createdBy" INTEGER;

CREATE INDEX "SssReport_createdBy_idx" ON "SssReport"("createdBy");

ALTER TABLE "SssReport" ADD CONSTRAINT "SssReport_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
