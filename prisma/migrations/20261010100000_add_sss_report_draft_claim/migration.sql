ALTER TABLE "SssReportDraft"
ADD COLUMN "continuedBy" INTEGER,
ADD COLUMN "continuedAt" TIMESTAMP(3);

CREATE INDEX "SssReportDraft_continuedBy_updatedAt_idx"
ON "SssReportDraft"("continuedBy", "updatedAt");
