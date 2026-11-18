-- Make loan amount and outstanding balance optional on the monitoring layer
ALTER TABLE "Loan" ALTER COLUMN "totalAmount" DROP NOT NULL;
ALTER TABLE "Loan" ALTER COLUMN "outstandingBalance" DROP NOT NULL;
