-- CreateEnum
CREATE TYPE "BankTransactionStatus" AS ENUM ('UNMATCHED', 'SUGGESTED', 'MATCHED', 'IGNORED');

-- AlterTable
ALTER TABLE "PropertyTenant" ADD COLUMN     "paymentReference" TEXT;

-- CreateTable
CREATE TABLE "BankStatementImport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "bankFormat" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "creditRows" INTEGER NOT NULL DEFAULT 0,
    "newRows" INTEGER NOT NULL DEFAULT 0,
    "autoMatched" INTEGER NOT NULL DEFAULT 0,
    "importedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatementImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(14,2),
    "fingerprint" TEXT NOT NULL,
    "status" "BankTransactionStatus" NOT NULL DEFAULT 'UNMATCHED',
    "paymentId" TEXT,
    "matchConfidence" INTEGER,
    "matchReasons" JSONB,
    "matchedAt" TIMESTAMP(3),
    "matchedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankStatementImport_userId_createdAt_idx" ON "BankStatementImport"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BankTransaction_userId_status_idx" ON "BankTransaction"("userId", "status");

-- CreateIndex
CREATE INDEX "BankTransaction_paymentId_idx" ON "BankTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "BankTransaction_importId_idx" ON "BankTransaction"("importId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_userId_fingerprint_key" ON "BankTransaction"("userId", "fingerprint");

-- Backfill: give every existing lease a stable EFT reference (DD-XXXXXX).
-- Hex-derived, uppercase; unique per landlord via the index below.
UPDATE "PropertyTenant"
SET "paymentReference" = 'DD-' || upper(substr(md5("id" || clock_timestamp()::text), 1, 6))
WHERE "paymentReference" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PropertyTenant_userId_paymentReference_key" ON "PropertyTenant"("userId", "paymentReference");

-- AddForeignKey
ALTER TABLE "BankStatementImport" ADD CONSTRAINT "BankStatementImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_importId_fkey" FOREIGN KEY ("importId") REFERENCES "BankStatementImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
