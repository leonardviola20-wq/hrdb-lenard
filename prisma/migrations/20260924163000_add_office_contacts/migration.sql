CREATE TABLE "OfficeContact" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "services" TEXT,
    "branch" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OfficeContact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OfficeContact_category_active_idx" ON "OfficeContact"("category", "active");
CREATE INDEX "OfficeContact_companyName_idx" ON "OfficeContact"("companyName");
