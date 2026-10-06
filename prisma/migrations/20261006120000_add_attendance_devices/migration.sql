CREATE TABLE "AttendanceDevice" (
    "id" SERIAL NOT NULL,
    "branch" TEXT NOT NULL,
    "deviceNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AttendanceDevice_deviceNumber_key" ON "AttendanceDevice"("deviceNumber");
CREATE INDEX "AttendanceDevice_branch_idx" ON "AttendanceDevice"("branch");
