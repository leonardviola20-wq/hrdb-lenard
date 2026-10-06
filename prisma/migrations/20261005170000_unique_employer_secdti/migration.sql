-- Normalize existing registration numbers so uniqueness is case-insensitive
-- for values stored before the application started canonicalizing them.
UPDATE "employer"
SET "secDti" = UPPER(BTRIM("secDti"))
WHERE "secDti" IS NOT NULL;

CREATE UNIQUE INDEX "employer_secDti_key" ON "employer"("secDti");
