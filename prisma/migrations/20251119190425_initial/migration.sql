-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'AGENCY');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'TOWNHOUSE', 'COTTAGE', 'ROOM', 'STUDIO', 'DUPLEX', 'PENTHOUSE', 'VILLA', 'OTHER');

-- CreateEnum
CREATE TYPE "RentalType" AS ENUM ('LONG_TERM', 'SHORT_TERM', 'BOTH');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OCCUPIED', 'MAINTENANCE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('SHORT_TERM', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('DIRECT', 'AIRBNB', 'BOOKING_COM', 'WEBSITE', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'EFT', 'CREDIT_CARD', 'DEBIT_CARD', 'PAYSTACK', 'PAYPAL', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'STUDENT');

-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('GUEST', 'TENANT', 'BOTH');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('DIRECT', 'AIRBNB', 'BOOKING_COM', 'WEBSITE', 'PHONE', 'EMAIL', 'WHATSAPP', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('BOOKING', 'VIEWING', 'GENERAL', 'COMPLAINT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESPONDED', 'CONVERTED', 'CLOSED', 'SPAM');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'PAINTING', 'CLEANING', 'LANDSCAPING', 'PEST_CONTROL', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('RENT', 'DEPOSIT', 'BOOKING', 'CLEANING_FEE', 'UTILITIES', 'LATE_FEE', 'DAMAGE', 'REFUND', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('MAINTENANCE', 'UTILITIES', 'INSURANCE', 'PROPERTY_TAX', 'MORTGAGE', 'CLEANING', 'SUPPLIES', 'ADVERTISING', 'PROFESSIONAL_FEES', 'MANAGEMENT_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LEASE_AGREEMENT', 'ID_DOCUMENT', 'PROOF_OF_INCOME', 'PROOF_OF_ADDRESS', 'BANK_STATEMENT', 'INVOICE', 'RECEIPT', 'CONTRACT', 'INSURANCE', 'TAX_DOCUMENT', 'INSPECTION_REPORT', 'INVENTORY', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('DRAFT', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('FOLLOW_UP', 'VIEWING', 'CHECK_IN', 'CHECK_OUT', 'INSPECTION', 'MAINTENANCE', 'PAYMENT_REMINDER', 'LEASE_RENEWAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('DIRECT', 'AIRBNB', 'BOOKING_COM', 'GOOGLE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING', 'INQUIRY', 'PAYMENT', 'MAINTENANCE', 'TASK', 'REVIEW', 'SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "IntegrationPlatform" AS ENUM ('AIRBNB', 'BOOKING_COM', 'GOOGLE_CALENDAR', 'PAYSTACK', 'STRIPE', 'WHATSAPP', 'QUICKBOOKS');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR', 'SYNCING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "photoUrl" TEXT,
    "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
    "companyName" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "propertyLimit" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "language" TEXT NOT NULL DEFAULT 'en',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'VIEWER',
    "canManageProperties" BOOLEAN NOT NULL DEFAULT false,
    "canManageBookings" BOOLEAN NOT NULL DEFAULT false,
    "canManageTenants" BOOLEAN NOT NULL DEFAULT false,
    "canManageFinancials" BOOLEAN NOT NULL DEFAULT false,
    "canViewReports" BOOLEAN NOT NULL DEFAULT true,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "propertyType" "PropertyType" NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'South Africa',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" DOUBLE PRECISION NOT NULL,
    "size" DOUBLE PRECISION,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "parkingSpaces" INTEGER NOT NULL DEFAULT 0,
    "amenities" JSONB,
    "images" JSONB,
    "primaryImageUrl" TEXT,
    "virtualTourUrl" TEXT,
    "rentalType" "RentalType" NOT NULL DEFAULT 'LONG_TERM',
    "monthlyRent" DECIMAL(10,2),
    "dailyRate" DECIMAL(10,2),
    "weeklyRate" DECIMAL(10,2),
    "monthlyRate" DECIMAL(10,2),
    "cleaningFee" DECIMAL(10,2),
    "securityDeposit" DECIMAL(10,2),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "minimumStay" INTEGER,
    "maximumStay" INTEGER,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "houseRules" TEXT,
    "airbnbListingId" TEXT,
    "bookingComId" TEXT,
    "syncCalendar" BOOLEAN NOT NULL DEFAULT false,
    "calendarUrls" JSONB,
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT,
    "bookingReference" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL DEFAULT 'SHORT_TERM',
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "numberOfNights" INTEGER NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT NOT NULL,
    "numberOfGuests" INTEGER NOT NULL DEFAULT 1,
    "baseRate" DECIMAL(10,2) NOT NULL,
    "cleaningFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amountDue" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "paymentDate" TIMESTAMP(3),
    "bookingSource" "BookingSource" NOT NULL DEFAULT 'DIRECT',
    "externalId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "checkedOut" BOOLEAN NOT NULL DEFAULT false,
    "checkedOutAt" TIMESTAMP(3),
    "guestNotes" TEXT,
    "internalNotes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "refundAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "idNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "currentAddress" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "employmentStatus" "EmploymentStatus",
    "employer" TEXT,
    "employerPhone" TEXT,
    "monthlyIncome" DECIMAL(10,2),
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "idDocumentUrl" TEXT,
    "proofOfIncomeUrl" TEXT,
    "proofOfAddressUrl" TEXT,
    "tenantType" "TenantType" NOT NULL DEFAULT 'GUEST',
    "rating" DOUBLE PRECISION DEFAULT 0,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyTenant" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leaseStartDate" TIMESTAMP(3) NOT NULL,
    "leaseEndDate" TIMESTAMP(3),
    "monthlyRent" DECIMAL(10,2) NOT NULL,
    "depositPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "leaseDocumentUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "moveInDate" TIMESTAMP(3),
    "moveOutDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "inquirySource" "InquirySource" NOT NULL DEFAULT 'DIRECT',
    "inquiryType" "InquiryType" NOT NULL DEFAULT 'BOOKING',
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "message" TEXT NOT NULL,
    "checkInDate" TIMESTAMP(3),
    "checkOutDate" TIMESTAMP(3),
    "numberOfGuests" INTEGER,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "assignedTo" TEXT,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "followUpDate" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "convertedToBooking" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "MaintenanceCategory" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "location" TEXT,
    "images" JSONB,
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "resolutionNotes" TEXT,
    "rating" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "tenantId" TEXT,
    "paymentReference" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "receiptUrl" TEXT,
    "invoiceUrl" TEXT,
    "notes" TEXT,
    "bankReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT,
    "vendorInvoice" TEXT,
    "receiptUrl" TEXT,
    "isDeductible" BOOLEAN NOT NULL DEFAULT false,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'UNPAID',
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentType" "DocumentType" NOT NULL,
    "category" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "tenantId" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "threadId" TEXT,
    "replyTo" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" "TaskType" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "relatedType" TEXT,
    "relatedId" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "reminderDate" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "bookingId" TEXT,
    "reviewerName" TEXT NOT NULL,
    "reviewerEmail" TEXT,
    "rating" INTEGER NOT NULL,
    "cleanliness" INTEGER,
    "communication" INTEGER,
    "checkIn" INTEGER,
    "accuracy" INTEGER,
    "location" INTEGER,
    "value" INTEGER,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "reviewSource" "ReviewSource" NOT NULL DEFAULT 'DIRECT',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "IntegrationPlatform" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "apiKey" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "errorMessage" TEXT,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Property_airbnbListingId_key" ON "Property"("airbnbListingId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_bookingComId_key" ON "Property"("bookingComId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingReference_key" ON "Booking"("bookingReference");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyTenant_propertyId_tenantId_key" ON "PropertyTenant"("propertyId", "tenantId");

-- CreateIndex
CREATE INDEX "Inquiry_status_priority_createdAt_idx" ON "Inquiry"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_status_priority_propertyId_idx" ON "MaintenanceRequest"("status", "priority", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentReference_key" ON "Payment"("paymentReference");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_userId_platform_key" ON "Integration"("userId", "platform");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyTenant" ADD CONSTRAINT "PropertyTenant_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyTenant" ADD CONSTRAINT "PropertyTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
