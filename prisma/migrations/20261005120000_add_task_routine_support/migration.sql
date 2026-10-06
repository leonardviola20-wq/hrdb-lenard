CREATE TABLE "TaskReschedule" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "previousDueDate" TIMESTAMP(3),
    "newDueDate" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskReschedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskReschedule_taskId_createdAt_idx" ON "TaskReschedule"("taskId", "createdAt");

ALTER TABLE "TaskReschedule" ADD CONSTRAINT "TaskReschedule_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TaskDependency" (
    "blockedTaskId" INTEGER NOT NULL,
    "prerequisiteTaskId" INTEGER NOT NULL,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("blockedTaskId", "prerequisiteTaskId")
);

CREATE INDEX "TaskDependency_prerequisiteTaskId_idx" ON "TaskDependency"("prerequisiteTaskId");

ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_blockedTaskId_fkey"
  FOREIGN KEY ("blockedTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_prerequisiteTaskId_fkey"
  FOREIGN KEY ("prerequisiteTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
