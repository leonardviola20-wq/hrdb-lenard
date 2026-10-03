ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "canAccessEmployees" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "User"
ADD COLUMN "accessiblePages" TEXT[] NOT NULL DEFAULT ARRAY['/dashboard', '/tasks', '/settings']::TEXT[];

UPDATE "User"
SET "accessiblePages" = array_append("accessiblePages", '/employees')
WHERE "canAccessEmployees" = TRUE
  AND NOT ('/employees' = ANY("accessiblePages"));