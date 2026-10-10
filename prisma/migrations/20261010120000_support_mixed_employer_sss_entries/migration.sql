ALTER TABLE "SssReportEntry"
ADD COLUMN "employeeEmployerId" INTEGER,
ADD COLUMN "employeeEmployerName" TEXT;

UPDATE "SssReportEntry" AS entry
SET "employeeEmployerId" = employee."employerId",
    "employeeEmployerName" = employer."name"
FROM "employee" AS employee
LEFT JOIN "employer" AS employer ON employer."id" = employee."employerId"
WHERE entry."employeeId" = employee."id";
