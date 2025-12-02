-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'CHECK_IN_REMINDER', 'CHECK_IN_INSTRUCTIONS', 'CHECK_OUT_REMINDER', 'CHECK_OUT_INSTRUCTIONS', 'BOOKING_COMPLETED', 'PAYMENT_REMINDER', 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE', 'MAINTENANCE_SCHEDULED', 'MAINTENANCE_COMPLETED', 'REVIEW_REQUEST', 'LEASE_RENEWAL_REMINDER', 'CUSTOM_DATE');

-- CreateEnum
CREATE TYPE "AiTone" AS ENUM ('PROFESSIONAL', 'FRIENDLY', 'CASUAL', 'FORMAL', 'WARM');

-- CreateEnum
CREATE TYPE "ScheduledMessageStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');

-- DropIndex
DROP INDEX "Booking_paymentStatus_idx";

-- DropIndex
DROP INDEX "Booking_propertyId_checkInDate_checkOutDate_idx";

-- DropIndex
DROP INDEX "Booking_propertyId_status_idx";

-- DropIndex
DROP INDEX "Booking_status_checkInDate_idx";

-- DropIndex
DROP INDEX "Booking_userId_createdAt_idx";

-- DropIndex
DROP INDEX "Booking_userId_status_idx";

-- DropIndex
DROP INDEX "Document_propertyId_idx";

-- DropIndex
DROP INDEX "Document_status_expiryDate_idx";

-- DropIndex
DROP INDEX "Document_tenantId_idx";

-- DropIndex
DROP INDEX "Document_userId_documentType_idx";

-- DropIndex
DROP INDEX "Expense_propertyId_expenseDate_idx";

-- DropIndex
DROP INDEX "Expense_userId_expenseDate_idx";

-- DropIndex
DROP INDEX "Expense_userId_status_idx";

-- DropIndex
DROP INDEX "Inquiry_propertyId_status_idx";

-- DropIndex
DROP INDEX "Inquiry_status_createdAt_idx";

-- DropIndex
DROP INDEX "Inquiry_userId_status_idx";

-- DropIndex
DROP INDEX "MaintenanceRequest_propertyId_status_idx";

-- DropIndex
DROP INDEX "MaintenanceRequest_status_priority_idx";

-- DropIndex
DROP INDEX "MaintenanceRequest_userId_status_idx";

-- DropIndex
DROP INDEX "Message_bookingId_idx";

-- DropIndex
DROP INDEX "Message_status_createdAt_idx";

-- DropIndex
DROP INDEX "Message_userId_messageType_idx";

-- DropIndex
DROP INDEX "Notification_userId_createdAt_idx";

-- DropIndex
DROP INDEX "Notification_userId_isRead_idx";

-- DropIndex
DROP INDEX "Payment_bookingId_status_idx";

-- DropIndex
DROP INDEX "Payment_status_paymentDate_idx";

-- DropIndex
DROP INDEX "Payment_tenantId_status_idx";

-- DropIndex
DROP INDEX "Payment_userId_paymentDate_idx";

-- DropIndex
DROP INDEX "Payment_userId_status_idx";

-- DropIndex
DROP INDEX "Property_city_idx";

-- DropIndex
DROP INDEX "Property_isAvailable_status_idx";

-- DropIndex
DROP INDEX "Property_status_idx";

-- DropIndex
DROP INDEX "Property_userId_status_idx";

-- DropIndex
DROP INDEX "PropertyTenant_leaseEndDate_isActive_idx";

-- DropIndex
DROP INDEX "PropertyTenant_propertyId_isActive_idx";

-- DropIndex
DROP INDEX "PropertyTenant_tenantId_isActive_idx";

-- DropIndex
DROP INDEX "Task_assignedTo_status_idx";

-- DropIndex
DROP INDEX "Task_status_dueDate_idx";

-- DropIndex
DROP INDEX "Task_userId_status_idx";

-- DropIndex
DROP INDEX "Tenant_status_idx";

-- DropIndex
DROP INDEX "Tenant_userId_status_idx";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiTone" "AiTone",
ADD COLUMN     "clickedAt" TIMESTAMP(3),
ADD COLUMN     "openedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MessageAutomation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" "AutomationTrigger" NOT NULL,
    "triggerOffset" INTEGER,
    "triggerTimeOfDay" TEXT,
    "messageType" "MessageType" NOT NULL,
    "subject" TEXT,
    "bodyTemplate" TEXT NOT NULL,
    "useAiEnhancement" BOOLEAN NOT NULL DEFAULT false,
    "aiTone" "AiTone" DEFAULT 'PROFESSIONAL',
    "applyToRentalType" "RentalType",
    "propertyIds" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "automationId" TEXT,
    "bookingId" TEXT,
    "tenantId" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "recipientName" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "ScheduledMessageStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "replyText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "tenantId" TEXT,
    "propertyId" TEXT,
    "participantName" TEXT NOT NULL,
    "participantEmail" TEXT,
    "participantPhone" TEXT,
    "subject" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CannedResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortcut" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CannedResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageAutomation_userId_isActive_idx" ON "MessageAutomation"("userId", "isActive");

-- CreateIndex
CREATE INDEX "MessageAutomation_triggerType_idx" ON "MessageAutomation"("triggerType");

-- CreateIndex
CREATE INDEX "ScheduledMessage_scheduledFor_status_idx" ON "ScheduledMessage"("scheduledFor", "status");

-- CreateIndex
CREATE INDEX "ScheduledMessage_userId_idx" ON "ScheduledMessage"("userId");

-- CreateIndex
CREATE INDEX "ScheduledMessage_bookingId_idx" ON "ScheduledMessage"("bookingId");

-- CreateIndex
CREATE INDEX "MessageThread_userId_isRead_isArchived_idx" ON "MessageThread"("userId", "isRead", "isArchived");

-- CreateIndex
CREATE INDEX "MessageThread_lastMessageAt_idx" ON "MessageThread"("lastMessageAt");

-- CreateIndex
CREATE INDEX "CannedResponse_userId_isActive_idx" ON "CannedResponse"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAutomation" ADD CONSTRAINT "MessageAutomation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledMessage" ADD CONSTRAINT "ScheduledMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledMessage" ADD CONSTRAINT "ScheduledMessage_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "MessageAutomation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledMessage" ADD CONSTRAINT "ScheduledMessage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledMessage" ADD CONSTRAINT "ScheduledMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CannedResponse" ADD CONSTRAINT "CannedResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
