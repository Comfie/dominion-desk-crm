# Property Management CRM - Complete Development Plan

## Project Overview

A modern, full-stack Property Management CRM system designed specifically for the South African market. The system caters to landlords managing both long-term rentals and short-term Airbnb properties, solving the critical problem of calendar synchronization, inquiry management, and property operations.

**Target Market:** South African property owners, landlords, Airbnb hosts, and small property management agencies managing 1-50 properties.

**Core Problem Solved:**

- Prevent double bookings across multiple platforms (Airbnb, Booking.com, direct bookings)
- Centralize inquiries from multiple sources
- Streamline tenant/guest communication
- Automate rent collection reminders
- Track maintenance and expenses
- Generate financial reports

## Tech Stack

- **Framework**: Next.js 14/15 (App Router with TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand (for complex state) + React Context
- **Calendar**: FullCalendar or react-big-calendar
- **File Upload**: Uploadthing or AWS S3
- **Payment Integration**: Paystack (SA), Stripe (International)
- **Email**: Resend or SendGrid
- **SMS**: Africa's Talking or Twilio
- **PDF Generation**: react-pdf or jsPDF
- **Maps**: Google Maps API or Mapbox
- **Deployment**: Vercel (frontend) + Railway/Supabase (database)
- **Version Control**: Git

## Project Structure

```
property-management-crm/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── verify-email/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── properties/
│   │   │   ├── page.tsx              # Properties list
│   │   │   ├── new/                  # Add new property
│   │   │   ├── [id]/                 # Property details
│   │   │   └── [id]/edit/            # Edit property
│   │   ├── bookings/
│   │   │   ├── page.tsx              # All bookings
│   │   │   ├── calendar/             # Calendar view
│   │   │   ├── new/                  # Create booking
│   │   │   └── [id]/                 # Booking details
│   │   ├── tenants/
│   │   │   ├── page.tsx              # Tenants list
│   │   │   ├── new/                  # Add tenant
│   │   │   └── [id]/                 # Tenant profile
│   │   ├── inquiries/
│   │   │   ├── page.tsx              # All inquiries
│   │   │   ├── [id]/                 # Inquiry details
│   │   │   └── respond/              # Quick respond
│   │   ├── maintenance/
│   │   │   ├── page.tsx              # Maintenance requests
│   │   │   ├── new/                  # Create request
│   │   │   └── [id]/                 # Request details
│   │   ├── financials/
│   │   │   ├── income/               # Income tracking
│   │   │   ├── expenses/             # Expense tracking
│   │   │   ├── invoices/             # Invoice management
│   │   │   └── reports/              # Financial reports
│   │   ├── documents/
│   │   │   ├── leases/               # Lease agreements
│   │   │   ├── contracts/            # Contracts
│   │   │   └── receipts/             # Payment receipts
│   │   ├── communications/
│   │   │   ├── messages/             # Message center
│   │   │   ├── email/                # Email templates
│   │   │   └── sms/                  # SMS campaigns
│   │   ├── tasks/
│   │   │   ├── page.tsx              # Task management
│   │   │   └── calendar/             # Task calendar
│   │   ├── reports/
│   │   │   ├── occupancy/            # Occupancy reports
│   │   │   ├── revenue/              # Revenue reports
│   │   │   └── analytics/            # Analytics dashboard
│   │   ├── integrations/
│   │   │   ├── airbnb/               # Airbnb sync
│   │   │   ├── booking/              # Booking.com sync
│   │   │   └── calendar/             # Calendar sync (Google, iCal)
│   │   └── settings/
│   │       ├── profile/
│   │       ├── team/
│   │       ├── billing/
│   │       └── preferences/
│   ├── (public)/                      # Public booking portal (optional)
│   │   ├── page.tsx
│   │   ├── properties/
│   │   └── book/
│   ├── api/
│   │   ├── auth/
│   │   ├── properties/
│   │   ├── bookings/
│   │   ├── tenants/
│   │   ├── inquiries/
│   │   ├── maintenance/
│   │   ├── financials/
│   │   ├── documents/
│   │   ├── communications/
│   │   ├── tasks/
│   │   ├── reports/
│   │   ├── integrations/
│   │   ├── webhooks/                  # For external integrations
│   │   └── upload/
│   └── layout.tsx
├── components/
│   ├── ui/                            # shadcn/ui components
│   ├── dashboard/                     # Dashboard components
│   ├── properties/
│   ├── bookings/
│   ├── calendar/
│   ├── forms/
│   └── shared/
├── lib/
│   ├── db.ts                          # Prisma client
│   ├── auth.ts                        # NextAuth config
│   ├── validations.ts                 # Zod schemas
│   ├── utils.ts
│   ├── email.ts                       # Email service
│   ├── sms.ts                         # SMS service
│   └── pdf.ts                         # PDF generation
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── hooks/                             # Custom React hooks
├── types/                             # TypeScript types
└── public/
```

## Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== USER MANAGEMENT ==============

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password        String    // Hashed
  firstName       String
  lastName        String
  phone           String?
  photoUrl        String?

  // Account type
  accountType     AccountType @default(INDIVIDUAL)
  companyName     String?

  // Subscription
  subscriptionTier SubscriptionTier @default(FREE)
  subscriptionStatus SubscriptionStatus @default(TRIAL)
  trialEndsAt     DateTime?
  subscriptionEndsAt DateTime?

  // Limits based on subscription
  propertyLimit   Int       @default(1)

  // Status
  isActive        Boolean   @default(true)
  emailVerified   Boolean   @default(false)
  emailVerifiedAt DateTime?

  // Preferences
  timezone        String    @default("Africa/Johannesburg")
  currency        String    @default("ZAR")
  language        String    @default("en")

  // Metadata
  lastLogin       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  properties      Property[]
  bookings        Booking[]
  tenants         Tenant[]
  inquiries       Inquiry[]
  maintenanceRequests MaintenanceRequest[]
  tasks           Task[]
  expenses        Expense[]
  payments        Payment[]
  documents       Document[]
  messages        Message[]
  notifications   Notification[]
  teamMembers     TeamMember[]
  auditLogs       AuditLog[]
}

enum AccountType {
  INDIVIDUAL
  COMPANY
  AGENCY
}

enum SubscriptionTier {
  FREE          // 1 property
  STARTER       // 5 properties - R199/month
  PROFESSIONAL  // 20 properties - R499/month
  ENTERPRISE    // Unlimited - R999/month
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
}

// ============== TEAM MANAGEMENT ==============

model TeamMember {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Team member details
  email           String
  firstName       String
  lastName        String
  role            TeamRole  @default(VIEWER)

  // Permissions
  canManageProperties Boolean @default(false)
  canManageBookings   Boolean @default(false)
  canManageTenants    Boolean @default(false)
  canManageFinancials Boolean @default(false)
  canViewReports      Boolean @default(true)

  // Status
  status          InviteStatus @default(PENDING)
  invitedAt       DateTime  @default(now())
  acceptedAt      DateTime?

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum TeamRole {
  OWNER
  ADMIN
  MANAGER
  VIEWER
}

enum InviteStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

// ============== PROPERTY MANAGEMENT ==============

model Property {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Basic Info
  name            String
  description     String?   @db.Text
  propertyType    PropertyType

  // Address
  address         String
  city            String
  province        String
  postalCode      String
  country         String    @default("South Africa")
  latitude        Float?
  longitude       Float?

  // Property Details
  bedrooms        Int
  bathrooms       Float
  size            Float?    // Square meters
  furnished       Boolean   @default(false)
  parkingSpaces   Int       @default(0)

  // Amenities (stored as JSON array)
  amenities       Json?     // ["wifi", "pool", "gym", "security", "garden"]

  // Media
  images          Json?     // Array of image URLs
  primaryImageUrl String?
  virtualTourUrl  String?

  // Rental Info
  rentalType      RentalType @default(LONG_TERM)
  monthlyRent     Decimal?  @db.Decimal(10, 2)
  dailyRate       Decimal?  @db.Decimal(10, 2)
  weeklyRate      Decimal?  @db.Decimal(10, 2)
  monthlyRate     Decimal?  @db.Decimal(10, 2)
  cleaningFee     Decimal?  @db.Decimal(10, 2)
  securityDeposit Decimal?  @db.Decimal(10, 2)

  // Availability
  isAvailable     Boolean   @default(true)
  availableFrom   DateTime?
  minimumStay     Int?      // Minimum nights for short-term
  maximumStay     Int?      // Maximum nights for short-term

  // Rules
  petsAllowed     Boolean   @default(false)
  smokingAllowed  Boolean   @default(false)
  checkInTime     String?   // "14:00"
  checkOutTime    String?   // "10:00"
  houseRules      String?   @db.Text

  // Integration
  airbnbListingId String?   @unique
  bookingComId    String?   @unique
  syncCalendar    Boolean   @default(false)
  calendarUrls    Json?     // Array of iCal URLs

  // Status
  status          PropertyStatus @default(ACTIVE)

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  bookings        Booking[]
  tenants         PropertyTenant[]
  inquiries       Inquiry[]
  maintenanceRequests MaintenanceRequest[]
  expenses        Expense[]
  documents       Document[]
  reviews         Review[]
}

enum PropertyType {
  APARTMENT
  HOUSE
  TOWNHOUSE
  COTTAGE
  ROOM
  STUDIO
  DUPLEX
  PENTHOUSE
  VILLA
  OTHER
}

enum RentalType {
  LONG_TERM     // Monthly leases
  SHORT_TERM    // Airbnb style
  BOTH          // Flexible
}

enum PropertyStatus {
  ACTIVE
  INACTIVE
  OCCUPIED
  MAINTENANCE
  ARCHIVED
}

// ============== BOOKING MANAGEMENT ==============

model Booking {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  tenantId        String?
  tenant          Tenant?   @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  // Booking Details
  bookingReference String   @unique
  bookingType     BookingType @default(SHORT_TERM)

  // Dates
  checkInDate     DateTime
  checkOutDate    DateTime
  numberOfNights  Int

  // Guest Info (if not linked to tenant)
  guestName       String
  guestEmail      String
  guestPhone      String
  numberOfGuests  Int       @default(1)

  // Pricing
  baseRate        Decimal   @db.Decimal(10, 2)
  cleaningFee     Decimal   @default(0) @db.Decimal(10, 2)
  serviceFee      Decimal   @default(0) @db.Decimal(10, 2)
  totalAmount     Decimal   @db.Decimal(10, 2)
  amountPaid      Decimal   @default(0) @db.Decimal(10, 2)
  amountDue       Decimal   @db.Decimal(10, 2)

  // Payment
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   PaymentMethod?
  paymentDate     DateTime?

  // Source
  bookingSource   BookingSource @default(DIRECT)
  externalId      String?   // Airbnb/Booking.com ID

  // Status
  status          BookingStatus @default(PENDING)

  // Check-in/out
  checkedIn       Boolean   @default(false)
  checkedInAt     DateTime?
  checkedOut      Boolean   @default(false)
  checkedOutAt    DateTime?

  // Notes
  guestNotes      String?   @db.Text
  internalNotes   String?   @db.Text

  // Cancellation
  cancelledAt     DateTime?
  cancellationReason String? @db.Text
  refundAmount    Decimal?  @db.Decimal(10, 2)

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  payments        Payment[]
  messages        Message[]
  reviews         Review[]
}

enum BookingType {
  SHORT_TERM    // Days/weeks
  LONG_TERM     // Months/years
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  NO_SHOW
  COMPLETED
}

enum BookingSource {
  DIRECT        // Direct booking
  AIRBNB
  BOOKING_COM
  WEBSITE
  REFERRAL
  OTHER
}

enum PaymentStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  REFUNDED
  FAILED
}

enum PaymentMethod {
  CASH
  EFT
  CREDIT_CARD
  DEBIT_CARD
  PAYSTACK
  PAYPAL
  OTHER
}

// ============== TENANT MANAGEMENT ==============

model Tenant {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Personal Info
  firstName       String
  lastName        String
  email           String
  phone           String
  alternatePhone  String?
  idNumber        String?   // SA ID number
  dateOfBirth     DateTime?

  // Address
  currentAddress  String?
  city            String?
  province        String?
  postalCode      String?

  // Employment
  employmentStatus EmploymentStatus?
  employer        String?
  employerPhone   String?
  monthlyIncome   Decimal?  @db.Decimal(10, 2)

  // Emergency Contact
  emergencyContactName  String?
  emergencyContactPhone String?
  emergencyContactRelation String?

  // Documents
  idDocumentUrl   String?
  proofOfIncomeUrl String?
  proofOfAddressUrl String?

  // Tenant Type
  tenantType      TenantType @default(GUEST)

  // Rating
  rating          Float?    @default(0)

  // Status
  status          TenantStatus @default(ACTIVE)

  // Notes
  notes           String?   @db.Text

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  properties      PropertyTenant[]
  bookings        Booking[]
  payments        Payment[]
  maintenanceRequests MaintenanceRequest[]
  messages        Message[]
  documents       Document[]
}

enum EmploymentStatus {
  EMPLOYED
  SELF_EMPLOYED
  UNEMPLOYED
  RETIRED
  STUDENT
}

enum TenantType {
  GUEST         // Short-term
  TENANT        // Long-term
  BOTH
}

enum TenantStatus {
  ACTIVE
  INACTIVE
  BLACKLISTED
}

// Junction table for many-to-many relationship
model PropertyTenant {
  id              String    @id @default(cuid())
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Lease Details
  leaseStartDate  DateTime
  leaseEndDate    DateTime?
  monthlyRent     Decimal   @db.Decimal(10, 2)
  depositPaid     Decimal   @default(0) @db.Decimal(10, 2)
  leaseDocumentUrl String?

  // Status
  isActive        Boolean   @default(true)
  moveInDate      DateTime?
  moveOutDate     DateTime?

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([propertyId, tenantId])
}

// ============== INQUIRY MANAGEMENT ==============

model Inquiry {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  propertyId      String?
  property        Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)

  // Inquiry Details
  inquirySource   InquirySource @default(DIRECT)
  inquiryType     InquiryType @default(BOOKING)

  // Contact Info
  contactName     String
  contactEmail    String
  contactPhone    String?

  // Inquiry
  message         String    @db.Text

  // Booking Interest (if applicable)
  checkInDate     DateTime?
  checkOutDate    DateTime?
  numberOfGuests  Int?

  // Status
  status          InquiryStatus @default(NEW)
  priority        Priority  @default(NORMAL)

  // Assignment
  assignedTo      String?

  // Response
  response        String?   @db.Text
  respondedAt     DateTime?
  respondedBy     String?

  // Follow-up
  followUpDate    DateTime?
  followUpNotes   String?   @db.Text

  // Conversion
  convertedToBooking Boolean @default(false)
  bookingId       String?

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([status, priority, createdAt])
}

enum InquirySource {
  DIRECT
  AIRBNB
  BOOKING_COM
  WEBSITE
  PHONE
  EMAIL
  WHATSAPP
  REFERRAL
  OTHER
}

enum InquiryType {
  BOOKING
  VIEWING
  GENERAL
  COMPLAINT
  MAINTENANCE
}

enum InquiryStatus {
  NEW
  IN_PROGRESS
  RESPONDED
  CONVERTED
  CLOSED
  SPAM
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

// ============== MAINTENANCE MANAGEMENT ==============

model MaintenanceRequest {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  tenantId        String?
  tenant          Tenant?   @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  // Request Details
  title           String
  description     String    @db.Text
  category        MaintenanceCategory
  priority        Priority  @default(NORMAL)

  // Location
  location        String?   // Specific location in property

  // Media
  images          Json?     // Array of image URLs

  // Assignment
  assignedTo      String?   // Contractor/service provider
  assignedAt      DateTime?

  // Status
  status          MaintenanceStatus @default(PENDING)

  // Scheduling
  scheduledDate   DateTime?
  completedDate   DateTime?

  // Cost
  estimatedCost   Decimal?  @db.Decimal(10, 2)
  actualCost      Decimal?  @db.Decimal(10, 2)

  // Resolution
  resolutionNotes String?   @db.Text

  // Rating
  rating          Int?      // 1-5 stars
  feedback        String?   @db.Text

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([status, priority, propertyId])
}

enum MaintenanceCategory {
  PLUMBING
  ELECTRICAL
  HVAC
  APPLIANCE
  STRUCTURAL
  PAINTING
  CLEANING
  LANDSCAPING
  PEST_CONTROL
  SECURITY
  OTHER
}

enum MaintenanceStatus {
  PENDING
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// ============== FINANCIAL MANAGEMENT ==============

model Payment {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  bookingId       String?
  booking         Booking?  @relation(fields: [bookingId], references: [id], onDelete: SetNull)
  tenantId        String?
  tenant          Tenant?   @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  // Payment Details
  paymentReference String   @unique
  paymentType     PaymentType

  // Amount
  amount          Decimal   @db.Decimal(10, 2)
  currency        String    @default("ZAR")

  // Payment Info
  paymentMethod   PaymentMethod
  paymentDate     DateTime

  // Status
  status          PaymentStatus @default(PENDING)

  // Receipt
  receiptUrl      String?
  invoiceUrl      String?

  // Notes
  notes           String?   @db.Text

  // Bank Details (for EFT)
  bankReference   String?

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum PaymentType {
  RENT
  DEPOSIT
  BOOKING
  CLEANING_FEE
  UTILITIES
  LATE_FEE
  DAMAGE
  REFUND
  OTHER
}

model Expense {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  propertyId      String?
  property        Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)

  // Expense Details
  title           String
  description     String?   @db.Text
  category        ExpenseCategory

  // Amount
  amount          Decimal   @db.Decimal(10, 2)
  currency        String    @default("ZAR")

  // Date
  expenseDate     DateTime

  // Vendor
  vendor          String?
  vendorInvoice   String?

  // Receipt
  receiptUrl      String?

  // Tax
  isDeductible    Boolean   @default(false)

  // Status
  status          ExpenseStatus @default(UNPAID)
  paidDate        DateTime?

  // Notes
  notes           String?   @db.Text

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum ExpenseCategory {
  MAINTENANCE
  UTILITIES
  INSURANCE
  PROPERTY_TAX
  MORTGAGE
  CLEANING
  SUPPLIES
  ADVERTISING
  PROFESSIONAL_FEES
  MANAGEMENT_FEE
  OTHER
}

enum ExpenseStatus {
  UNPAID
  PAID
  OVERDUE
}

// ============== DOCUMENT MANAGEMENT ==============

model Document {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  propertyId      String?
  property        Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)
  tenantId        String?
  tenant          Tenant?   @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  // Document Details
  title           String
  description     String?   @db.Text
  documentType    DocumentType
  category        String?

  // File
  fileUrl         String
  fileName        String
  fileSize        Int       // Bytes
  mimeType        String

  // Dates
  issueDate       DateTime?
  expiryDate      DateTime?

  // Access
  isPublic        Boolean   @default(false)

  // Status
  status          DocumentStatus @default(ACTIVE)

  // Metadata
  uploadedBy      String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum DocumentType {
  LEASE_AGREEMENT
  ID_DOCUMENT
  PROOF_OF_INCOME
  PROOF_OF_ADDRESS
  BANK_STATEMENT
  INVOICE
  RECEIPT
  CONTRACT
  INSURANCE
  TAX_DOCUMENT
  INSPECTION_REPORT
  INVENTORY
  OTHER
}

enum DocumentStatus {
  ACTIVE
  EXPIRED
  ARCHIVED
}

// ============== COMMUNICATION ==============

model Message {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  bookingId       String?
  booking         Booking?  @relation(fields: [bookingId], references: [id], onDelete: SetNull)
  tenantId        String?
  tenant          Tenant?   @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  // Message Details
  subject         String?
  message         String    @db.Text
  messageType     MessageType

  // Direction
  direction       MessageDirection

  // Contact
  recipientEmail  String?
  recipientPhone  String?

  // Status
  status          MessageStatus @default(SENT)
  sentAt          DateTime?
  deliveredAt     DateTime?
  readAt          DateTime?

  // Thread
  threadId        String?   // For message threading
  replyTo         String?   // ID of message being replied to

  // Attachments
  attachments     Json?     // Array of attachment URLs

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum MessageType {
  EMAIL
  SMS
  WHATSAPP
  IN_APP
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}

enum MessageStatus {
  DRAFT
  SENT
  DELIVERED
  READ
  FAILED
}

// ============== TASK MANAGEMENT ==============

model Task {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Task Details
  title           String
  description     String?   @db.Text
  taskType        TaskType
  priority        Priority  @default(NORMAL)

  // Assignment
  assignedTo      String?

  // Dates
  dueDate         DateTime?
  completedDate   DateTime?

  // Related Entity
  relatedType     String?   // "property", "booking", "tenant", etc.
  relatedId       String?

  // Status
  status          TaskStatus @default(TODO)

  // Reminder
  reminderDate    DateTime?
  reminderSent    Boolean   @default(false)

  // Notes
  notes           String?   @db.Text

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum TaskType {
  FOLLOW_UP
  VIEWING
  CHECK_IN
  CHECK_OUT
  INSPECTION
  MAINTENANCE
  PAYMENT_REMINDER
  LEASE_RENEWAL
  OTHER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// ============== REVIEWS ==============

model Review {
  id              String    @id @default(cuid())
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  bookingId       String?
  booking         Booking?  @relation(fields: [bookingId], references: [id], onDelete: SetNull)

  // Review Details
  reviewerName    String
  reviewerEmail   String?

  // Rating
  rating          Int       // 1-5 stars
  cleanliness     Int?
  communication   Int?
  checkIn         Int?
  accuracy        Int?
  location        Int?
  value           Int?

  // Review
  title           String?
  comment         String    @db.Text

  // Response
  response        String?   @db.Text
  respondedAt     DateTime?

  // Source
  reviewSource    ReviewSource @default(DIRECT)

  // Status
  isPublic        Boolean   @default(true)
  isVerified      Boolean   @default(false)

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum ReviewSource {
  DIRECT
  AIRBNB
  BOOKING_COM
  GOOGLE
  OTHER
}

// ============== NOTIFICATIONS ==============

model Notification {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Notification Details
  title           String
  message         String    @db.Text
  notificationType NotificationType

  // Link
  linkUrl         String?

  // Status
  isRead          Boolean   @default(false)
  readAt          DateTime?

  // Metadata
  createdAt       DateTime  @default(now())
}

enum NotificationType {
  BOOKING
  INQUIRY
  PAYMENT
  MAINTENANCE
  TASK
  REVIEW
  SYSTEM
  OTHER
}

// ============== AUDIT LOG ==============

model AuditLog {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Action
  action          String    // "created", "updated", "deleted"
  entity          String    // "property", "booking", etc.
  entityId        String

  // Changes (JSON)
  changes         Json?     // Before/after values

  // IP Address
  ipAddress       String?
  userAgent       String?

  // Metadata
  createdAt       DateTime  @default(now())

  @@index([userId, createdAt])
  @@index([entity, entityId])
}

// ============== INTEGRATIONS ==============

model Integration {
  id              String    @id @default(cuid())
  userId          String

  // Integration Details
  platform        IntegrationPlatform
  isActive        Boolean   @default(false)

  // Credentials (encrypted)
  accessToken     String?
  refreshToken    String?
  apiKey          String?

  // Settings
  syncEnabled     Boolean   @default(false)
  lastSyncAt      DateTime?

  // Status
  status          IntegrationStatus @default(DISCONNECTED)
  errorMessage    String?

  // Metadata
  connectedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([userId, platform])
}

enum IntegrationPlatform {
  AIRBNB
  BOOKING_COM
  GOOGLE_CALENDAR
  PAYSTACK
  STRIPE
  WHATSAPP
  QUICKBOOKS
}

enum IntegrationStatus {
  CONNECTED
  DISCONNECTED
  ERROR
  SYNCING
}
```

## Implementation Phases

### Phase 1: Project Setup & Foundation (Week 1)

**Day 1-2: Environment Setup**

Tasks:

1. Initialize Next.js project
2. Setup Prisma with PostgreSQL
3. Configure NextAuth.js
4. Install shadcn/ui components
5. Setup Tailwind CSS
6. Configure environment variables
7. Create project structure

Commands:

```bash
# Create Next.js app
npx create-next-app@latest property-crm --typescript --tailwind --app --use-npm

cd property-crm

# Install core dependencies
npm install @prisma/client prisma
npm install next-auth @auth/prisma-adapter
npm install react-hook-form @hookform/resolvers zod
npm install date-fns
npm install lucide-react
npm install zustand
npm install bcryptjs
npm install @types/bcryptjs -D

# Calendar
npm install react-big-calendar
npm install @types/react-big-calendar -D

# PDF generation
npm install jspdf
npm install html2canvas

# File upload
npm install uploadthing @uploadthing/react

# Charts
npm install recharts

# Maps (optional)
npm install @vis.gl/react-google-maps

# Initialize Prisma
npx prisma init

# Initialize shadcn/ui
npx shadcn-ui@latest init
```

**shadcn/ui Components:**

```bash
npx shadcn-ui@latest add button input label card dropdown-menu dialog table form select textarea badge avatar calendar tabs alert toast pagination switch checkbox radio-group separator slider
```

**Environment Variables (.env):**

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/property_crm_db"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Uploadthing
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="noreply@propertycrm.com"

# SMS (Africa's Talking)
AFRICAS_TALKING_API_KEY="your-api-key"
AFRICAS_TALKING_USERNAME="your-username"

# Payment (Paystack for SA)
PAYSTACK_SECRET_KEY="your-paystack-secret"
PAYSTACK_PUBLIC_KEY="your-paystack-public-key"

# Google Maps (optional)
GOOGLE_MAPS_API_KEY="your-google-maps-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Day 3-4: Database & Authentication**

Tasks:

1. Copy Prisma schema (from above)
2. Run migrations
3. Create seed data
4. Setup NextAuth.js
5. Create login/register pages
6. Create middleware for route protection

**Seed File (prisma/seed.ts):**

```typescript
import { PrismaClient, SubscriptionTier, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const hashedPassword = await bcrypt.hash('Demo@123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@propertycrm.com' },
    update: {},
    create: {
      email: 'demo@propertycrm.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      propertyLimit: 20,
    },
  });

  // Create sample property
  const property = await prisma.property.create({
    data: {
      userId: user.id,
      name: 'Modern 2BR Apartment in Sandton',
      description: 'Beautiful modern apartment with stunning city views',
      propertyType: 'APARTMENT',
      address: '123 Sandton Drive',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2196',
      country: 'South Africa',
      bedrooms: 2,
      bathrooms: 2,
      furnished: true,
      parkingSpaces: 1,
      rentalType: 'BOTH',
      monthlyRent: 15000,
      dailyRate: 800,
      amenities: ['wifi', 'pool', 'gym', 'security'],
      isAvailable: true,
      status: 'ACTIVE',
    },
  });

  console.log('Database seeded successfully!');
  console.log('Demo Credentials:');
  console.log('Email: demo@propertycrm.com');
  console.log('Password: Demo@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run seed
```

**Day 5-7: Dashboard Layout**

Tasks:

1. Create dashboard layout with sidebar
2. Setup navigation
3. Create dashboard homepage with statistics
4. Add dark mode toggle (optional)
5. Create notification system

Components to create:

- `/components/dashboard/sidebar.tsx`
- `/components/dashboard/header.tsx`
- `/components/dashboard/stats-card.tsx`
- `/app/(dashboard)/dashboard/page.tsx`

### Phase 2: Property Management (Week 2)

**Day 8-10: Properties CRUD**

Features:

- Properties list with grid/table view
- Add new property form (multi-step)
- Edit property details
- Delete/archive property
- Property details page
- Image upload (multiple images)
- Map integration for address

Pages:

- `/app/(dashboard)/properties/page.tsx`
- `/app/(dashboard)/properties/new/page.tsx`
- `/app/(dashboard)/properties/[id]/page.tsx`
- `/app/(dashboard)/properties/[id]/edit/page.tsx`

API Routes:

- `/app/api/properties/route.ts` - GET (list), POST (create)
- `/app/api/properties/[id]/route.ts` - GET, PUT, DELETE
- `/app/api/upload/route.ts` - File upload handler

**Day 11-14: Property Details & Features**

Features:

- View property analytics (occupancy rate, revenue)
- Property calendar (availability)
- Linked bookings list
- Linked tenants list
- Maintenance history
- Financial overview
- Documents associated with property

### Phase 3: Booking Management (Week 3-4)

**Day 15-18: Booking System**

Features:

- Bookings calendar view (FullCalendar)
- Create new booking (availability check)
- Edit booking
- Cancel booking with refund calculation
- Booking details page
- Check-in/check-out workflow
- Guest communication

Pages:

- `/app/(dashboard)/bookings/page.tsx`
- `/app/(dashboard)/bookings/calendar/page.tsx`
- `/app/(dashboard)/bookings/new/page.tsx`
- `/app/(dashboard)/bookings/[id]/page.tsx`

Components:

- `/components/bookings/booking-calendar.tsx`
- `/components/bookings/booking-form.tsx`
- `/components/bookings/availability-checker.tsx`

API Routes:

- `/app/api/bookings/route.ts`
- `/app/api/bookings/[id]/route.ts`
- `/app/api/bookings/availability/route.ts`
- `/app/api/bookings/check-in/route.ts`
- `/app/api/bookings/check-out/route.ts`

**Day 19-21: Calendar Synchronization**

Features:

- Import iCal URLs (Airbnb, Booking.com)
- Export property calendar as iCal
- Sync bookings from external sources
- Prevent double bookings
- Manual sync trigger
- Auto-sync scheduling (cron job)

API Routes:

- `/app/api/calendar/import/route.ts`
- `/app/api/calendar/export/route.ts`
- `/app/api/calendar/sync/route.ts`

**Key Feature: Double Booking Prevention**

```typescript
// Pseudo-code for availability check
async function checkAvailability(propertyId, checkIn, checkOut) {
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      propertyId,
      status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      OR: [
        {
          checkInDate: { lte: checkOut },
          checkOutDate: { gte: checkIn },
        },
      ],
    },
  });

  return overlappingBookings.length === 0;
}
```

### Phase 4: Tenant Management (Week 4-5)

**Day 22-25: Tenant System**

Features:

- Tenant list with filters
- Add tenant (with document upload)
- Edit tenant details
- Tenant profile page
- Tenant history (bookings, payments, maintenance)
- Document management (ID, proof of income, etc.)
- Lease agreement management
- Tenant rating/notes

Pages:

- `/app/(dashboard)/tenants/page.tsx`
- `/app/(dashboard)/tenants/new/page.tsx`
- `/app/(dashboard)/tenants/[id]/page.tsx`

API Routes:

- `/app/api/tenants/route.ts`
- `/app/api/tenants/[id]/route.ts`
- `/app/api/tenants/[id]/documents/route.ts`

**Day 26-28: Lease Management**

Features:

- Create lease agreement
- Lease template system
- Auto-generate lease PDF
- Track lease expiry dates
- Lease renewal reminders
- Link tenant to property with lease details

### Phase 5: Inquiry Management (Week 5-6)

**Day 29-32: Inquiry System**

Features:

- Inquiry inbox (similar to email)
- Inquiry details view
- Quick respond templates
- Convert inquiry to booking
- Inquiry status tracking (new, responded, converted)
- Priority tagging
- Assignment to team members
- Inquiry sources tracking

Pages:

- `/app/(dashboard)/inquiries/page.tsx`
- `/app/(dashboard)/inquiries/[id]/page.tsx`

Components:

- `/components/inquiries/inquiry-list.tsx`
- `/components/inquiries/inquiry-detail.tsx`
- `/components/inquiries/quick-respond.tsx`
- `/components/inquiries/response-templates.tsx`

API Routes:

- `/app/api/inquiries/route.ts`
- `/app/api/inquiries/[id]/route.ts`
- `/app/api/inquiries/[id]/respond/route.ts`
- `/app/api/inquiries/convert/route.ts`

**Day 33-35: Inquiry Automation**

Features:

- Auto-respond templates
- Inquiry routing rules
- Email parsing (automatically create inquiries from emails)
- WhatsApp integration (optional)
- Follow-up reminders

### Phase 6: Maintenance Management (Week 6-7)

**Day 36-39: Maintenance Requests**

Features:

- Maintenance request list
- Create maintenance request (with photos)
- Assign to contractors
- Track status (pending, in progress, completed)
- Schedule maintenance
- Cost tracking
- Tenant reporting (allow tenants to submit requests)
- Contractor database

Pages:

- `/app/(dashboard)/maintenance/page.tsx`
- `/app/(dashboard)/maintenance/new/page.tsx`
- `/app/(dashboard)/maintenance/[id]/page.tsx`

API Routes:

- `/app/api/maintenance/route.ts`
- `/app/api/maintenance/[id]/route.ts`

**Day 40-42: Maintenance Scheduling**

Features:

- Maintenance calendar
- Recurring maintenance (e.g., pool cleaning)
- Preventive maintenance reminders
- Maintenance reports

### Phase 7: Financial Management (Week 7-8)

**Day 43-46: Payments & Income**

Features:

- Payment tracking
- Record payment (cash, EFT, card)
- Generate invoices
- Payment reminders (automated)
- Payment history
- Outstanding payments dashboard
- Receipt generation (PDF)
- Payment reports

Pages:

- `/app/(dashboard)/financials/income/page.tsx`
- `/app/(dashboard)/financials/payments/[id]/page.tsx`

Components:

- `/components/financials/payment-form.tsx`
- `/components/financials/invoice-generator.tsx`
- `/components/financials/receipt-generator.tsx`

API Routes:

- `/app/api/payments/route.ts`
- `/app/api/payments/[id]/route.ts`
- `/app/api/invoices/generate/route.ts`
- `/app/api/receipts/generate/route.ts`

**Day 47-49: Expenses**

Features:

- Expense tracking
- Expense categories
- Upload receipts
- Link expenses to properties
- Expense reports
- Tax-deductible expenses
- Expense vs income comparison

Pages:

- `/app/(dashboard)/financials/expenses/page.tsx`
- `/app/(dashboard)/financials/expenses/new/page.tsx`

**Day 50-52: Financial Reports**

Features:

- Income statement (P&L)
- Cash flow report
- Property-wise revenue comparison
- Monthly/yearly summaries
- Tax reports
- Export to Excel/PDF

Pages:

- `/app/(dashboard)/financials/reports/page.tsx`

### Phase 8: Communications (Week 8-9)

**Day 53-56: Message Center**

Features:

- Unified inbox (email, SMS, in-app)
- Send email to tenant/guest
- Send SMS
- Email templates
- SMS templates
- Bulk messaging
- Message threading
- Auto-responses

Pages:

- `/app/(dashboard)/communications/messages/page.tsx`
- `/app/(dashboard)/communications/email/page.tsx`
- `/app/(dashboard)/communications/sms/page.tsx`

API Routes:

- `/app/api/messages/route.ts`
- `/app/api/messages/send-email/route.ts`
- `/app/api/messages/send-sms/route.ts`

**Day 57-59: Automated Communications**

Features:

- Booking confirmation emails
- Check-in instructions (automated)
- Payment reminder emails/SMS
- Lease expiry reminders
- Review request emails
- Welcome messages

### Phase 9: Task Management (Week 9-10)

**Day 60-63: Tasks System**

Features:

- Task list (todo, in progress, completed)
- Create task
- Assign tasks to team members
- Task calendar
- Task reminders
- Link tasks to properties/bookings/tenants
- Task templates

Pages:

- `/app/(dashboard)/tasks/page.tsx`
- `/app/(dashboard)/tasks/calendar/page.tsx`

API Routes:

- `/app/api/tasks/route.ts`
- `/app/api/tasks/[id]/route.ts`

**Day 64-66: Task Automation**

Features:

- Auto-create tasks based on triggers:
  - New booking → Create check-in task
  - Lease ending in 30 days → Create renewal task
  - Maintenance request → Create follow-up task

### Phase 10: Reports & Analytics (Week 10-11)

**Day 67-70: Analytics Dashboard**

Features:

- Key metrics cards:
  - Total properties
  - Occupancy rate
  - Revenue (monthly, yearly)
  - Outstanding payments
  - Pending inquiries
- Charts:
  - Revenue trend
  - Occupancy trend
  - Booking sources breakdown
  - Property performance comparison
- Recent activity feed

Components:

- `/components/dashboard/metrics-card.tsx`
- `/components/dashboard/revenue-chart.tsx`
- `/components/dashboard/occupancy-chart.tsx`

**Day 71-73: Advanced Reports**

Features:

- Occupancy reports
- Revenue reports (by property, by month)
- Expense reports
- Guest demographics
- Booking source analysis
- Inquiry conversion rates
- Maintenance costs analysis
- Export all reports (Excel, PDF)

Pages:

- `/app/(dashboard)/reports/occupancy/page.tsx`
- `/app/(dashboard)/reports/revenue/page.tsx`
- `/app/(dashboard)/reports/analytics/page.tsx`

### Phase 11: Integrations (Week 11-12)

**Day 74-77: Airbnb Integration**

Features:

- Connect Airbnb account (OAuth)
- Import Airbnb bookings
- Sync Airbnb calendar
- Update availability on Airbnb
- Import Airbnb messages

API Routes:

- `/app/api/integrations/airbnb/connect/route.ts`
- `/app/api/integrations/airbnb/sync/route.ts`
- `/app/api/webhooks/airbnb/route.ts`

**Day 78-80: Booking.com Integration**

Similar to Airbnb integration

**Day 81-83: Payment Gateway Integration**

Features:

- Paystack integration (for South Africa)
- Stripe integration (international)
- Online payment collection
- Payment webhooks
- Refund processing

### Phase 12: Settings & Administration (Week 12-13)

**Day 84-87: User Settings**

Features:

- Profile management
- Change password
- Preferences (timezone, currency, language)
- Notification settings
- Billing information

Pages:

- `/app/(dashboard)/settings/profile/page.tsx`
- `/app/(dashboard)/settings/preferences/page.tsx`
- `/app/(dashboard)/settings/billing/page.tsx`

**Day 88-90: Team Management**

Features:

- Invite team members
- Role management (owner, admin, manager, viewer)
- Permission settings
- Team member list
- Activity log

Pages:

- `/app/(dashboard)/settings/team/page.tsx`

**Day 91-93: Subscription & Billing**

Features:

- View current plan
- Upgrade/downgrade plan
- Payment history
- Invoice downloads
- Usage metrics (properties count, etc.)

### Phase 13: Mobile Responsiveness & Polish (Week 13-14)

**Day 94-98: Mobile Optimization**

Tasks:

- Ensure all pages are mobile-responsive
- Touch-friendly buttons and forms
- Mobile navigation (hamburger menu)
- Test on various devices
- Optimize images for mobile
- PWA setup (optional)

**Day 99-105: Final Polish**

Tasks:

- UI/UX improvements
- Loading states
- Error handling
- Form validations
- Empty states
- Success messages
- Tooltips and help text
- Accessibility improvements
- Performance optimization
- SEO optimization (meta tags)

### Phase 14: Testing & Deployment (Week 14-15)

**Day 106-108: Testing**

Tasks:

- Test all CRUD operations
- Test authentication and authorization
- Test file uploads
- Test email/SMS sending
- Test payment integration (test mode)
- Test calendar synchronization
- Test on multiple browsers
- Test on mobile devices
- Performance testing
- Security testing

**Day 109-112: Deployment Preparation**

Tasks:

1. Setup production database (Railway/Supabase)
2. Configure production environment variables
3. Setup domain name
4. Setup email service (production)
5. Setup SMS service (production)
6. Configure Paystack production keys
7. Setup error monitoring (Sentry)
8. Setup analytics (Google Analytics, Mixpanel)
9. Create backup procedures

**Day 113-115: Deployment & Launch**

Tasks:

1. Deploy to Vercel
2. Run production migrations
3. Seed production database with initial data
4. Test production site thoroughly
5. Setup monitoring and alerts
6. Create user documentation
7. Create video tutorials
8. Soft launch to beta users

**Deployment Commands:**

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Run production migrations
npx prisma migrate deploy
npx prisma generate
```

---

## Key Features Breakdown

### 1. Calendar Synchronization (The Killer Feature)

**Problem:** Double bookings from multiple platforms
**Solution:** Import iCal feeds from Airbnb, Booking.com, and sync availability

**Implementation:**

```typescript
// lib/calendar-sync.ts
import ical from 'ical';

export async function syncExternalCalendar(calendarUrl: string, propertyId: string) {
  const response = await fetch(calendarUrl);
  const icalData = await response.text();
  const events = ical.parseICS(icalData);

  for (const event of Object.values(events)) {
    if (event.type === 'VEVENT') {
      // Create or update booking
      await prisma.booking.upsert({
        where: { externalId: event.uid },
        create: {
          propertyId,
          externalId: event.uid,
          checkInDate: event.start,
          checkOutDate: event.end,
          guestName: event.summary,
          status: 'CONFIRMED',
          bookingSource: 'AIRBNB', // or detect from calendar
          // ... other fields
        },
        update: {
          checkInDate: event.start,
          checkOutDate: event.end,
          status: 'CONFIRMED',
        },
      });
    }
  }
}
```

### 2. Unified Inquiry Management

**Problem:** Inquiries scattered across platforms
**Solution:** Centralized inbox with auto-conversion to bookings

**Features:**

- Email forwarding to custom email (e.g., property-123@yourcrm.com)
- Parse and create inquiries automatically
- Quick response templates
- One-click convert to booking

### 3. Smart Availability Checker

**Before Creating Booking:**

```typescript
async function checkAvailability(propertyId, checkIn, checkOut) {
  // Check database bookings
  const dbBookings = await prisma.booking.findMany({
    where: {
      propertyId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      OR: [
        {
          AND: [{ checkInDate: { lte: checkOut } }, { checkOutDate: { gte: checkIn } }],
        },
      ],
    },
  });

  // Check external calendars (cached)
  const externalBookings = await getExternalBookings(propertyId, checkIn, checkOut);

  return {
    available: dbBookings.length === 0 && externalBookings.length === 0,
    conflicts: [...dbBookings, ...externalBookings],
  };
}
```

### 4. Automated Communication Flow

**Booking Lifecycle Emails:**

1. Booking created → Confirmation email
2. 3 days before → Check-in instructions
3. Check-in day → Welcome message with WiFi password
4. Check-out day → Check-out reminder
5. After check-out → Review request

**Implementation with cron jobs or scheduled tasks**

### 5. Financial Dashboard

**Key Metrics:**

- Total revenue (monthly, yearly)
- Revenue by property
- Occupancy rate
- Average daily rate (ADR)
- Revenue per available room (RevPAR)
- Outstanding payments
- Expense breakdown

**Charts:**

- Revenue trend (last 12 months)
- Occupancy trend
- Income vs Expenses
- Property performance comparison

---

## Monetization Strategy

### Pricing Tiers (South African Market)

**Free Tier:**

- 1 property
- Basic features
- Limited bookings (20/month)
- No integrations
- Email support

**Starter - R199/month:**

- 5 properties
- All basic features
- Unlimited bookings
- Calendar sync (iCal import)
- Email + SMS support
- Payment processing

**Professional - R499/month:**

- 20 properties
- All Starter features
- Airbnb/Booking.com integration
- Team members (up to 3)
- Advanced reports
- Priority support
- White-label option

**Enterprise - R999/month:**

- Unlimited properties
- All Professional features
- Custom integrations
- Unlimited team members
- API access
- Dedicated support
- Custom domain

### Additional Revenue Streams

1. **Transaction Fees:**
   - 2% fee on payments processed through platform
   - Only on Starter tier and above

2. **Add-ons:**
   - SMS credits (R0.30/SMS)
   - Additional team members (R50/month each)
   - WhatsApp integration (R99/month)
   - Custom reports (R149/month)

3. **Professional Services:**
   - Setup assistance (R999 one-time)
   - Data migration (R1,499 one-time)
   - Custom integrations (R2,999+)
   - Training sessions (R799/session)

---

## Marketing & Go-to-Market Strategy

### Target Customer Segments

**Primary:**

1. **Airbnb Hosts** (1-5 properties)
   - Pain: Calendar management chaos
   - Message: "Never double-book again"

2. **Small Landlords** (2-10 properties)
   - Pain: Manual tenant tracking, payment reminders
   - Message: "Automate your rental business"

3. **Property Managers** (10-50 properties)
   - Pain: Spreadsheet hell, no centralization
   - Message: "Professional property management simplified"

### Launch Strategy

**Phase 1: Beta (Month 1-2)**

- Recruit 20 beta users
- Free access in exchange for feedback
- Iterate based on feedback
- Build case studies

**Phase 2: Soft Launch (Month 3-4)**

- Launch website with free tier
- Content marketing (blog posts, SEO)
- Facebook/Instagram ads targeting Airbnb hosts
- Property investor groups on Facebook
- Offer founding member discount (50% off first year)

**Phase 3: Full Launch (Month 5-6)**

- Product Hunt launch
- Press releases
- Partnership with property management associations
- Affiliate program for property agents
- YouTube tutorials and demos

### Marketing Channels

**Paid:**

- Google Ads (keywords: "property management software south africa")
- Facebook/Instagram Ads (target Airbnb hosts)
- LinkedIn Ads (target property managers)

**Organic:**

- SEO (blog content on property management tips)
- YouTube tutorials
- Facebook groups (property investors)
- Twitter (engage with property management community)
- LinkedIn (B2B outreach)

**Partnerships:**

- Property management associations
- Real estate agencies
- Airbnb host meetups
- Property investor networks

---

## Competitive Analysis

### Competitors (South African Market)

1. **Property24 (Property Portal)**
   - Focus: Listings only, no management
   - Gap: No booking or calendar sync

2. **MRI Software (Enterprise)**
   - Focus: Large property managers
   - Gap: Too expensive, complex for small landlords

3. **Yardi Breeze (International)**
   - Focus: Long-term rentals
   - Gap: No Airbnb integration, expensive

4. **Guesty (Airbnb Management)**
   - Focus: Short-term rentals only
   - Gap: Expensive ($9/property/month), no long-term focus

5. **Excel Spreadsheets (Most Common)**
   - Gap: Everything!

### Your Competitive Advantages

1. **Affordable for SA Market** (R199 vs $50+)
2. **Both short-term and long-term** rentals
3. **Calendar sync** (Airbnb + Booking.com + direct)
4. **Built for SA** (Paystack, Africa's Talking, ZAR)
5. **Simple and intuitive** (not enterprise bloat)
6. **Local support** (same timezone)

---

## Technical Architecture

### System Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Vercel)      │
└────────┬────────┘
         │
         ├─────────────┬─────────────┬──────────────┐
         │             │             │              │
┌────────▼────────┐ ┌──▼──────────┐ ┌▼──────────┐ ┌▼──────────┐
│   PostgreSQL    │ │ Uploadthing │ │  Resend   │ │ Paystack  │
│   (Railway)     │ │  (Storage)  │ │  (Email)  │ │ (Payment) │
└─────────────────┘ └─────────────┘ └───────────┘ └───────────┘
```

### API Design Principles

**RESTful API Structure:**

```
GET    /api/properties              # List properties
POST   /api/properties              # Create property
GET    /api/properties/:id          # Get single property
PUT    /api/properties/:id          # Update property
DELETE /api/properties/:id          # Delete property

GET    /api/bookings?propertyId=X   # List bookings (filtered)
POST   /api/bookings                # Create booking
GET    /api/bookings/:id            # Get booking details
PUT    /api/bookings/:id            # Update booking
DELETE /api/bookings/:id            # Cancel booking
```

### Database Optimization

**Indexes:**

```prisma
@@index([userId, status])          # Fast user queries
@@index([propertyId, checkInDate]) # Fast calendar queries
@@index([status, priority])        # Fast inquiry filtering
```

**Performance Considerations:**

- Use pagination for large lists
- Cache property listings (ISR in Next.js)
- Optimize images with Next.js Image
- Use database connection pooling
- Implement rate limiting

---

## Security Considerations

### Authentication & Authorization

**Row-Level Security:**

```typescript
// Ensure users can only access their own data
const properties = await prisma.property.findMany({
  where: {
    userId: session.user.id, // Critical!
  },
});
```

**API Route Protection:**

```typescript
export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of logic
}
```

### Data Protection

- Hash passwords (bcrypt)
- Encrypt sensitive data (Prisma field-level encryption)
- HTTPS only (Vercel handles this)
- CSRF protection (NextAuth handles this)
- XSS prevention (React escapes by default)
- SQL injection prevention (Prisma ORM)
- Rate limiting on API routes
- Input validation (Zod schemas)

### GDPR Compliance (If Targeting EU)

- Cookie consent
- Data export functionality
- Data deletion functionality
- Privacy policy
- Terms of service

---

## Performance Optimization

### Frontend Optimization

1. **Code Splitting:**
   - Use dynamic imports for heavy components
   - Lazy load calendar and charts

2. **Image Optimization:**
   - Use Next.js Image component
   - Compress images before upload
   - Use WebP format

3. **Caching:**
   - Cache static data (property listings)
   - Use SWR or React Query for client-side caching
   - ISR for semi-static pages

### Backend Optimization

1. **Database:**
   - Add indexes on frequently queried fields
   - Use database connection pooling
   - Optimize complex queries

2. **API Routes:**
   - Implement pagination
   - Use cursor-based pagination for large datasets
   - Cache expensive queries (Redis if needed)

3. **Serverless:**
   - Keep functions lightweight
   - Use edge functions for simple logic

---

## Monitoring & Analytics

### Application Monitoring

**Tools:**

- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring
- **LogRocket** - Session replay
- **Uptime Robot** - Uptime monitoring

### Business Metrics

**Key Metrics to Track:**

- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Properties per user
- Bookings created per month
- Conversion rate (inquiry → booking)
- Customer Lifetime Value (LTV)
- Churn rate
- Net Promoter Score (NPS)

**Implementation:**

- Google Analytics
- Mixpanel
- Custom analytics dashboard

---

## User Documentation

### User Guide Sections

1. **Getting Started**
   - Account setup
   - Adding first property
   - Creating first booking

2. **Properties**
   - Adding properties
   - Managing amenities
   - Uploading photos
   - Setting pricing

3. **Bookings**
   - Creating bookings
   - Calendar management
   - Check-in/check-out process
   - Cancellations and refunds

4. **Tenants**
   - Adding tenants
   - Document management
   - Lease agreements

5. **Financials**
   - Recording payments
   - Tracking expenses
   - Generating reports

6. **Integrations**
   - Connecting Airbnb
   - Calendar synchronization
   - Payment setup

### Video Tutorials

**Priority Videos:**

1. Platform overview (5 min)
2. Adding your first property (8 min)
3. Creating and managing bookings (10 min)
4. Setting up calendar sync (7 min)
5. Financial reporting (6 min)

---

## Roadmap (Post-Launch)

### Q1 Features (Months 4-6)

- Mobile app (React Native)
- WhatsApp Business integration
- Advanced automation rules
- Custom email templates editor
- Multi-currency support

### Q2 Features (Months 7-9)

- Owner portal (for property owners to view reports)
- Tenant portal (self-service)
- Smart pricing recommendations (AI-powered)
- Channel manager (manage multiple listing sites)
- Accounting software integration (Xero, QuickBooks)

### Q3 Features (Months 10-12)

- Property websites (auto-generated)
- Direct booking widget
- Advanced analytics (AI insights)
- Multi-language support
- White-label solution for agencies

---

## Development Guidelines

### Code Standards

**TypeScript:**

- Use strict mode
- Avoid `any` type
- Define interfaces for all data structures

**Components:**

- Keep components small (<200 lines)
- Use composition over inheritance
- Extract reusable logic into hooks

**API Routes:**

- Always validate input with Zod
- Return consistent error responses
- Use proper HTTP status codes
- Add request logging

**Testing:**

- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows

### Git Workflow

**Branching Strategy:**

```
main (production)
  ├── develop (staging)
      ├── feature/property-crud
      ├── feature/booking-calendar
      └── feature/payment-integration
```

**Commit Messages:**

```
feat: Add property creation form
fix: Fix double booking bug
docs: Update API documentation
refactor: Simplify booking validation
test: Add tests for payment flow
```

---

## Success Criteria

### Technical Metrics

- [ ] 99.9% uptime
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Zero critical security vulnerabilities
- [ ] Mobile responsive on all pages
- [ ] Accessibility score > 90

### Business Metrics

**Month 3 (Beta End):**

- [ ] 20 active beta users
- [ ] 100+ properties managed
- [ ] 500+ bookings created
- [ ] 90% user satisfaction

**Month 6 (Launch):**

- [ ] 100 paying customers
- [ ] MRR: R20,000
- [ ] Churn rate < 10%
- [ ] 50 properties on Professional plan

**Month 12 (End of Year 1):**

- [ ] 500 paying customers
- [ ] MRR: R150,000
- [ ] 1000+ properties managed
- [ ] 10,000+ bookings per month
- [ ] Team of 3 (you + 2 hires)

---

## Investment & Resources

### Initial Costs (Year 1)

**Development (Your Time):**

- 3-4 months full-time development
- Value: R120,000 (if hired)
- Your cost: Sweat equity

**Infrastructure (Monthly):**

- Domain: R15/month
- Hosting (Vercel): R0 (free tier initially)
- Database (Railway): R90/month
- Email (Resend): R170/month
- SMS: Pay per use (~R500/month)
- Total: ~R775/month (~R9,300/year)

**Tools & Services:**

- Design tools (Figma): R0 (free tier)
- Error monitoring (Sentry): R0 (free tier)
- Analytics: R0 (Google Analytics)

**Marketing (Year 1):**

- Landing page design: R2,000 (one-time)
- Google Ads: R5,000/month = R60,000/year
- Facebook Ads: R3,000/month = R36,000/year
- Content creation: R2,000/month = R24,000/year
- Total: R122,000/year

**Legal:**

- Company registration: R500
- Terms of Service: R1,500
- Privacy Policy: R1,000
- Total: R3,000

**Grand Total Year 1: R134,300**

### Break-Even Analysis

**Monthly Costs:** ~R11,000
**Break-even:** 23 customers on Starter plan (R499)

**Realistic Projection:**

- Month 6: 100 customers × R199 avg = R19,900 (not profitable yet)
- Month 9: 250 customers × R249 avg = R62,250 (profitable!)
- Month 12: 500 customers × R299 avg = R149,500 (sustainable!)

---

## Risk Mitigation

### Technical Risks

**Risk:** Data loss
**Mitigation:** Daily automated backups, test restore procedures

**Risk:** Security breach
**Mitigation:** Regular security audits, penetration testing, bug bounty program

**Risk:** Scaling issues
**Mitigation:** Load testing, horizontal scaling, CDN

### Business Risks

**Risk:** Low user adoption
**Mitigation:** Beta testing, iterate based on feedback, freemium model

**Risk:** Competition
**Mitigation:** Focus on niche (SA market), build integrations faster

**Risk:** Churn
**Mitigation:** Excellent onboarding, responsive support, continuous improvements

---

## Support Strategy

### Support Channels

**Tier 1: Self-Service**

- Knowledge base
- Video tutorials
- FAQ
- In-app tooltips

**Tier 2: Community**

- Facebook group
- Discord community
- User forums

**Tier 3: Direct Support**

- Email support (response within 24 hours)
- Live chat (business hours)
- Phone support (Professional plan and above)
- Screen sharing sessions (Enterprise)

### Support SLAs

**Free Tier:**

- Email support
- 72-hour response time

**Starter:**

- Email + chat support
- 24-hour response time

**Professional:**

- Priority support
- 12-hour response time
- Phone support available

**Enterprise:**

- Dedicated support
- 4-hour response time
- 24/7 emergency hotline

---

## Exit Strategy (Long-term)

### Potential Outcomes

**Option 1: Bootstrap to Profitability**

- Grow organically
- Maintain ownership
- Lifestyle business (R500k - R2M/year revenue)

**Option 2: Raise Funding**

- Seed round (R5M - R10M)
- Accelerate growth
- Expand to other African markets

**Option 3: Acquisition**

- Target acquirers:
  - Property24
  - Private Property
  - International property tech companies
  - Real estate agencies
- Exit valuation: 5-10x revenue

**Option 4: Franchise Model**

- License software to property management agencies
- White-label solution
- Recurring licensing fees

---

## Final Checklist Before Launch

### Pre-Launch Checklist

**Technical:**

- [ ] All core features working
- [ ] Mobile responsive
- [ ] Security audit completed
- [ ] Performance optimized
- [ ] Error monitoring setup
- [ ] Backup procedures tested
- [ ] SSL certificate active
- [ ] Domain configured

**Legal:**

- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie consent implemented
- [ ] POPIA compliance (SA data protection)
- [ ] Company registered

**Business:**

- [ ] Pricing finalized
- [ ] Payment gateway tested (live mode)
- [ ] Email templates ready
- [ ] SMS templates ready
- [ ] Support email setup
- [ ] Knowledge base created
- [ ] Video tutorials recorded

**Marketing:**

- [ ] Landing page live
- [ ] Social media accounts created
- [ ] Google Analytics setup
- [ ] SEO optimized
- [ ] Launch announcement ready
- [ ] Beta users ready to share

---

## Conclusion

This Property Management CRM is designed to solve real problems for South African property owners and managers. With your full-stack skills (Angular, .NET, Next.js) and experience building complex systems, you have everything you need to build this successfully.

**Key Success Factors:**

1. **Start with MVP** - Don't build everything at once
2. **Get real users early** - Beta test with 10-20 property owners
3. **Iterate based on feedback** - Let users guide feature priorities
4. **Focus on the killer feature** - Calendar sync that prevents double bookings
5. **Nail the onboarding** - Make it easy to get started
6. **Provide excellent support** - Differentiate through service
7. **Market consistently** - Build in public, share progress

**Next Steps:**

1. Show your Apostle the church system (get that win!)
2. Start Phase 1 of this Dominion Desk (Week 1-2)
3. Recruit 5 beta testers from your network
4. Build MVP (Weeks 1-8)
5. Launch beta (Week 9)
6. Iterate and improve (Weeks 10-15)
7. Soft launch with pricing (Month 4)
8. Scale and grow!

You've got this! 🚀

**Good luck building your Property Management CRM!**
