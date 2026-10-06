CREATE TABLE "TaskPrerequisiteItem" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TaskPrerequisiteItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskPrerequisiteItem_taskId_createdAt_idx" ON "TaskPrerequisiteItem"("taskId", "createdAt");

ALTER TABLE "TaskPrerequisiteItem" ADD CONSTRAINT "TaskPrerequisiteItem_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "TaskPrerequisiteItem" ("taskId", "title", "isCompleted", "completedAt")
SELECT dependency."blockedTaskId", prerequisite."title", prerequisite."status" = 'COMPLETED',
       CASE WHEN prerequisite."status" = 'COMPLETED' THEN prerequisite."updatedAt" ELSE NULL END
FROM "TaskDependency" AS dependency
JOIN "Task" AS prerequisite ON prerequisite."id" = dependency."prerequisiteTaskId";
