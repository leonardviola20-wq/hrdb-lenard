ALTER TABLE "Attendance" ADD COLUMN "branch" TEXT;

CREATE TABLE "AttendanceImport" (
    "id" SERIAL NOT NULL,
    "branch" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "importedRows" INTEGER NOT NULL,
    "duplicateRows" INTEGER NOT NULL,
    "unmatchedRows" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttendancePunch" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "attendanceId" INTEGER NOT NULL,
    "importId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "deviceNumber" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendancePunch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AttendancePunch_employeeId_date_time_deviceNumber_branch_key"
ON "AttendancePunch"("employeeId", "date", "time", "deviceNumber", "branch");
CREATE INDEX "AttendanceImport_createdAt_idx" ON "AttendanceImport"("createdAt");
CREATE INDEX "AttendancePunch_date_branch_idx" ON "AttendancePunch"("date", "branch");
CREATE INDEX "AttendancePunch_attendanceId_time_idx" ON "AttendancePunch"("attendanceId", "time");

ALTER TABLE "AttendancePunch"
ADD CONSTRAINT "AttendancePunch_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttendancePunch"
ADD CONSTRAINT "AttendancePunch_attendanceId_fkey"
FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttendancePunch"
ADD CONSTRAINT "AttendancePunch_importId_fkey"
FOREIGN KEY ("importId") REFERENCES "AttendanceImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
