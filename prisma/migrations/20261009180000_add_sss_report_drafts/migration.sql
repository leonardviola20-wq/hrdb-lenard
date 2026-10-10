CREATE TABLE "SssReportDraft" (
    "id" SERIAL NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "employerId" INTEGER,
    "prn" TEXT NOT NULL DEFAULT '',
    "applicableMonth" INTEGER NOT NULL DEFAULT 1,
    "applicableYear" INTEGER NOT NULL,
    "amountDue" TEXT NOT NULL DEFAULT '',
    "entries" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SssReportDraft_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SssReportDraft_createdBy_updatedAt_idx" ON "SssReportDraft"("createdBy", "updatedAt");

ALTER TABLE "SssReportDraft" ADD CONSTRAINT "SssReportDraft_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
