ALTER TABLE "SssLoan"
ALTER COLUMN "loanAmount" DROP NOT NULL,
ADD COLUMN "transactionNumber" TEXT;
