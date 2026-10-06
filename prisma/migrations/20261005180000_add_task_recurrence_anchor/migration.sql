ALTER TABLE "Task"
ADD COLUMN "recurrenceAnchor" TIMESTAMP(3);

UPDATE "Task"
SET "recurrenceAnchor" = "dueDate"
WHERE "recurrence" <> 'NONE'
  AND "dueDate" IS NOT NULL;
