-- CreateEnum
CREATE TYPE "LandlordOwnerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MandateType" AS ENUM ('PLACEMENT_ONLY', 'MANAGED_RENTAL');

-- CreateEnum
CREATE TYPE "MandateExclusivity" AS ENUM ('SOLE', 'DUAL', 'OPEN');

-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ViewingStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RentalApplicationStatus" AS ENUM ('NEW', 'APPLICATION_RECEIVED', 'SCREENING', 'APPROVED', 'REJECTED', 'LEASE_OFFER_SENT', 'LEASE_SIGNED', 'DEPOSIT_PAID', 'PLACED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'PASSED', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ReferenceCheckStatus" AS ENUM ('NOT_REQUESTED', 'REQUESTED', 'RECEIVED', 'PASSED', 'FAILED');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "landlordOwnerId" TEXT;

-- CreateTable
CREATE TABLE "LandlordOwner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "idNumber" TEXT,
    "taxNumber" TEXT,
    "vatNumber" TEXT,
    "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
    "status" "LandlordOwnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandlordOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalMandate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "landlordOwnerId" TEXT,
    "mandateType" "MandateType" NOT NULL,
    "exclusivity" "MandateExclusivity" NOT NULL DEFAULT 'OPEN',
    "status" "MandateStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "placementFeePercentage" DECIMAL(5,2),
    "managementFeePercentage" DECIMAL(5,2),
    "vatApplicable" BOOLEAN NOT NULL DEFAULT true,
    "mandateDocumentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalMandate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viewing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "rentalApplicationId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "status" "ViewingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "attendedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "feedback" TEXT,
    "followUpNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Viewing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "tenantId" TEXT,
    "applicantFirstName" TEXT NOT NULL,
    "applicantLastName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "applicantPhone" TEXT,
    "idNumber" TEXT,
    "requestedMoveInDate" TIMESTAMP(3),
    "proposedLeaseStartDate" TIMESTAMP(3),
    "proposedLeaseEndDate" TIMESTAMP(3),
    "proposedMonthlyRent" DECIMAL(10,2),
    "proposedDeposit" DECIMAL(10,2),
    "status" "RentalApplicationStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "approvalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantScreening" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rentalApplicationId" TEXT NOT NULL,
    "overallStatus" "ScreeningStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "creditCheckStatus" "ScreeningStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "affordabilityStatus" "ScreeningStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "employerReferenceStatus" "ReferenceCheckStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "landlordReferenceStatus" "ReferenceCheckStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "ficaStatus" "ScreeningStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "declaredMonthlyIncome" DECIMAL(10,2),
    "rentToIncomeRatio" DECIMAL(5,2),
    "riskScore" INTEGER,
    "consentReceived" BOOLEAN NOT NULL DEFAULT false,
    "consentReceivedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantScreening_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LandlordOwner_userId_idx" ON "LandlordOwner"("userId");

-- CreateIndex
CREATE INDEX "LandlordOwner_email_idx" ON "LandlordOwner"("email");

-- CreateIndex
CREATE INDEX "RentalMandate_userId_status_idx" ON "RentalMandate"("userId", "status");

-- CreateIndex
CREATE INDEX "RentalMandate_propertyId_idx" ON "RentalMandate"("propertyId");

-- CreateIndex
CREATE INDEX "RentalMandate_landlordOwnerId_idx" ON "RentalMandate"("landlordOwnerId");

-- CreateIndex
CREATE INDEX "Viewing_userId_scheduledFor_idx" ON "Viewing"("userId", "scheduledFor");

-- CreateIndex
CREATE INDEX "Viewing_propertyId_scheduledFor_idx" ON "Viewing"("propertyId", "scheduledFor");

-- CreateIndex
CREATE INDEX "Viewing_status_idx" ON "Viewing"("status");

-- CreateIndex
CREATE INDEX "RentalApplication_userId_status_idx" ON "RentalApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "RentalApplication_propertyId_status_idx" ON "RentalApplication"("propertyId", "status");

-- CreateIndex
CREATE INDEX "RentalApplication_inquiryId_idx" ON "RentalApplication"("inquiryId");

-- CreateIndex
CREATE INDEX "RentalApplication_tenantId_idx" ON "RentalApplication"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantScreening_rentalApplicationId_key" ON "ApplicantScreening"("rentalApplicationId");

-- CreateIndex
CREATE INDEX "ApplicantScreening_userId_overallStatus_idx" ON "ApplicantScreening"("userId", "overallStatus");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_landlordOwnerId_fkey" FOREIGN KEY ("landlordOwnerId") REFERENCES "LandlordOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandlordOwner" ADD CONSTRAINT "LandlordOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalMandate" ADD CONSTRAINT "RentalMandate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalMandate" ADD CONSTRAINT "RentalMandate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalMandate" ADD CONSTRAINT "RentalMandate_landlordOwnerId_fkey" FOREIGN KEY ("landlordOwnerId") REFERENCES "LandlordOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viewing" ADD CONSTRAINT "Viewing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viewing" ADD CONSTRAINT "Viewing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viewing" ADD CONSTRAINT "Viewing_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viewing" ADD CONSTRAINT "Viewing_rentalApplicationId_fkey" FOREIGN KEY ("rentalApplicationId") REFERENCES "RentalApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalApplication" ADD CONSTRAINT "RentalApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalApplication" ADD CONSTRAINT "RentalApplication_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalApplication" ADD CONSTRAINT "RentalApplication_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalApplication" ADD CONSTRAINT "RentalApplication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantScreening" ADD CONSTRAINT "ApplicantScreening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantScreening" ADD CONSTRAINT "ApplicantScreening_rentalApplicationId_fkey" FOREIGN KEY ("rentalApplicationId") REFERENCES "RentalApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
