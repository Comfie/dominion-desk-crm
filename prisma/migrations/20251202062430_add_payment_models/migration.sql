/*
  Warnings:

  - A unique constraint covering the columns `[invoiceNumber]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'OVERDUE';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "reminderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderSentAt" TIMESTAMP(3),
ALTER COLUMN "paymentMethod" DROP NOT NULL,
ALTER COLUMN "paymentDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "autoSendReminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN     "monthlyRent" DECIMAL(10,2),
ADD COLUMN     "nextPaymentDue" TIMESTAMP(3),
ADD COLUMN     "paymentDueDay" INTEGER DEFAULT 1,
ADD COLUMN     "reminderDaysBefore" INTEGER DEFAULT 3;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankBranchCode" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankSwiftCode" TEXT,
ADD COLUMN     "paymentInstructions" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_invoiceNumber_key" ON "Payment"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Payment_userId_tenantId_idx" ON "Payment"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "Payment_dueDate_status_idx" ON "Payment"("dueDate", "status");

-- CreateIndex
CREATE INDEX "Payment_status_reminderSent_idx" ON "Payment"("status", "reminderSent");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
