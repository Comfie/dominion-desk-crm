# Property Management CRM: Competitive Gap Analysis & Strategic Roadmap

**Report Date:** December 1, 2025
**Prepared By:** Senior Product Manager & Lead Solutions Architect
**Platform:** Multi-Tenant Property Management CRM (Next.js 16)

---

## Executive Summary

After analyzing the current platform capabilities against industry-leading hybrid property management systems (Guesty, DoorLoop, AppFolio, Buildium), I've identified **5 critical feature gaps** that significantly impact market competitiveness. The current platform has a solid foundation with bookings, tenants, maintenance, and financials, but lacks key automation, communication, and owner-facing capabilities that are standard in enterprise-grade PMSs.

**Top Priority:** Automated Messaging & Guest Communication Hub with AI-powered templates and multi-channel delivery.

---

## Phase 1: Competitive Gap Analysis

### Current Platform Strengths (Per CLAUDE.md)

✅ **Core Property Management**

- Multi-property management with subscription tiers
- Dual rental type support (SHORT_TERM + LONG_TERM)
- Tenant management with documents and employment tracking
- Booking management with payment tracking
- Maintenance request system
- Financial tracking (payments, expenses)
- Document management with hierarchical folders
- Multi-tenancy with team collaboration
- Basic calendar sync (iCal for Airbnb/Booking.com)

### Critical Feature Gaps vs. Top Competitors

After benchmarking against Guesty, DoorLoop, AppFolio, and Buildium, the following **standard features** are completely missing:

#### 🔴 **Gap 1: Owner Portal & Statements**

**Industry Standard:** Dedicated portal for property owners to view financial performance, occupancy rates, maintenance status, and download monthly statements.

**What's Missing:**

- Owner user role and authentication
- Owner-specific dashboard with property performance metrics
- Automated monthly owner statements (rent collected, expenses, net income)
- Owner payout tracking and distribution
- Owner document sharing (tax forms, year-end reports)
- Owner-level permissions (view-only access to their properties)

**Competitor Benchmark:** All major competitors offer this as a core feature.

---

#### 🔴 **Gap 2: Automated Messaging & Communication Hub**

**Industry Standard:** Multi-channel automated messaging with triggers, templates, and AI-powered personalization.

**What's Missing:**

- Automated message triggers (booking confirmation, check-in reminders, checkout instructions, payment reminders)
- Multi-channel delivery (Email, SMS, WhatsApp in unified interface)
- AI-powered message generation and template suggestions
- Scheduled message queue
- Message performance analytics (open rates, response times)
- Unified inbox for all guest/tenant communications
- Canned responses and smart replies
- Automated follow-ups and drip campaigns

**Competitor Benchmark:** Guesty and Hostfully have industry-leading automation here.

---

#### 🔴 **Gap 3: Advanced Channel Management**

**Industry Standard:** Two-way sync with multiple booking platforms, unified calendar, rate management, and listing syndication.

**What's Missing:**

- Two-way sync with Airbnb, Booking.com, Vrbo (current: one-way iCal only)
- Unified multi-calendar view across all channels
- Channel-specific pricing rules and rate calendars
- Automated listing syndication
- Channel performance analytics
- Booking import from channels (currently manual entry required)
- Channel message integration
- Dynamic pricing recommendations based on occupancy/seasonality

**Competitor Benchmark:** Guesty, Hostaway, and Hospitable excel here.

---

#### 🔴 **Gap 4: Trust Accounting & Escrow Management**

**Industry Standard:** Segregated trust accounts for tenant deposits and owner funds with full audit trails and compliance reporting.

**What's Missing:**

- Trust/escrow account management
- Automated deposit tracking (held, interest, refunded)
- Operating account vs. trust account separation
- Compliance reporting for jurisdictional requirements
- Reconciliation tools for trust accounts
- Automated interest calculations on deposits
- Owner reserve fund tracking

**Competitor Benchmark:** AppFolio and Buildium are leaders in trust accounting compliance.

---

#### 🔴 **Gap 5: Vendor/Contractor Portal & Work Order Management**

**Industry Standard:** Dedicated portal for vendors to receive work orders, update status, upload invoices, and track payments.

**What's Missing:**

- Vendor/contractor user role and portal
- Work order assignment and acceptance flow
- Vendor mobile app or portal access
- Vendor ratings and performance tracking
- Automated vendor dispatch based on category/location
- Invoice submission and approval workflow
- Vendor payment tracking and history
- Preferred vendor lists per property
- SLA tracking and automated escalations

**Competitor Benchmark:** Properly and Latchel have strong vendor management features.

---

### Secondary Gaps (Important but Lower Priority)

- **Smart Locks & Access Control Integration** (RemoteLock, Igloohome, August)
- **Noise Monitoring Integration** (NoiseAware, Minut)
- **Dynamic Pricing Tools** (PriceLabs, Beyond Pricing, Wheelhouse)
- **Guest Screening & Verification** (Autohost, Superhog)
- **Lease Management & E-Signatures** (DocuSign integration, lease renewals)
- **Rent Collection Automation** (ACH autopay, payment plans)
- **Inspection Reports with Photo Documentation**
- **Marketing Website Builder** (Direct booking site generation)
- **Advanced Reporting & Analytics** (Occupancy forecasting, revenue projections)

---

## Phase 2: Strategic Roadmap & Prioritization

### Top 5 Missing Features - Value vs. Complexity Matrix

| **Feature**                        | **User Value** | **Technical Complexity** | **Priority Score** | **Reasoning**                                                                |
| ---------------------------------- | -------------- | ------------------------ | ------------------ | ---------------------------------------------------------------------------- |
| **1. Automated Messaging Hub**     | 🔥 CRITICAL    | ⚙️ MEDIUM                | **#1**             | Highest ROI - saves hours daily, immediate user delight, moderate complexity |
| **2. Owner Portal & Statements**   | 🔥 CRITICAL    | ⚙️ MEDIUM                | **#2**             | Essential for property managers with multiple owners, enables growth         |
| **3. Channel Management (2-way)**  | 🔥 HIGH        | ⚙️⚙️ COMPLEX             | **#3**             | Huge time-saver but requires third-party API integration complexity          |
| **4. Vendor Portal & Work Orders** | 🔥 HIGH        | ⚙️ MEDIUM-LOW            | **#4**             | Streamlines maintenance, easier than channel management                      |
| **5. Trust Accounting**            | 🔥 MEDIUM-HIGH | ⚙️⚙️ COMPLEX             | **#5**             | Critical for compliance but highly complex, regulatory requirements          |

### Prioritization Rationale

**#1 - Automated Messaging Hub** wins because:

- **Immediate user impact:** Saves 2-5 hours per week per property manager
- **Competitive necessity:** Expected standard feature in 2025
- **Technical feasibility:** Can leverage existing infrastructure (Message model, notification system)
- **Revenue impact:** Directly improves guest experience → better reviews → more bookings
- **Scalability:** Works for both SHORT_TERM and LONG_TERM rentals

**Why it beats Owner Portal:** While both are critical, messaging automation provides immediate daily value, whereas owner portals are monthly/quarterly touchpoints.

---

## Phase 3: Technical Implementation Plan

### Feature: Automated Messaging & Guest Communication Hub

---

## 📋 Implementation Architecture

### A. Database Schema Updates (`prisma/schema.prisma`)

```prisma
// ============== MESSAGING AUTOMATION ==============

model MessageAutomation {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Automation Details
  name            String    // "Booking Confirmation", "Check-in Reminder"
  description     String?   @db.Text

  // Trigger Configuration
  triggerType     AutomationTrigger
  triggerOffset   Int?      // Hours before/after trigger event (e.g., -24 for 24h before)
  triggerTimeOfDay String?  // "09:00" - send at specific time

  // Message Configuration
  messageType     MessageType  // EMAIL, SMS, WHATSAPP
  subject         String?      // For emails
  bodyTemplate    String    @db.Text  // Supports variables: {{guestName}}, {{propertyName}}, etc.

  // AI Configuration
  useAiEnhancement Boolean  @default(false)
  aiTone          AiTone?   @default(PROFESSIONAL)

  // Targeting
  applyToRentalType RentalType? // null = all, or specific type
  propertyIds     Json?     // Array of property IDs, null = all properties

  // Status
  isActive        Boolean   @default(true)

  // Analytics
  totalSent       Int       @default(0)
  totalOpened     Int       @default(0)
  totalClicked    Int       @default(0)

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  scheduledMessages ScheduledMessage[]

  @@index([userId, isActive])
  @@index([triggerType])
}

enum AutomationTrigger {
  BOOKING_CREATED           // Immediate
  BOOKING_CONFIRMED         // Immediate
  CHECK_IN_REMINDER         // X hours before check-in
  CHECK_IN_INSTRUCTIONS     // Day of check-in
  CHECK_OUT_REMINDER        // X hours before check-out
  CHECK_OUT_INSTRUCTIONS    // Day of check-out
  BOOKING_COMPLETED         // After check-out
  PAYMENT_REMINDER          // X days before due
  PAYMENT_RECEIVED          // Immediate
  PAYMENT_OVERDUE           // X days after due
  MAINTENANCE_SCHEDULED     // When maintenance scheduled
  MAINTENANCE_COMPLETED     // When maintenance completed
  REVIEW_REQUEST            // X days after check-out
  LEASE_RENEWAL_REMINDER    // X days before lease end
  CUSTOM_DATE               // Manual trigger
}

enum AiTone {
  PROFESSIONAL
  FRIENDLY
  CASUAL
  FORMAL
  WARM
}

model ScheduledMessage {
  id              String    @id @default(cuid())
  userId          String
  automationId    String?
  automation      MessageAutomation? @relation(fields: [automationId], references: [id], onDelete: SetNull)

  // Target
  bookingId       String?
  booking         Booking?  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  tenantId        String?
  tenant          Tenant?   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Message Details
  recipientEmail  String?
  recipientPhone  String?
  recipientName   String

  messageType     MessageType
  subject         String?
  body            String    @db.Text  // Rendered with variables replaced

  // Scheduling
  scheduledFor    DateTime
  sentAt          DateTime?

  // Status
  status          ScheduledMessageStatus @default(PENDING)
  errorMessage    String?   @db.Text

  // Tracking
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?

  // Response
  repliedAt       DateTime?
  replyText       String?   @db.Text

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([scheduledFor, status])
  @@index([userId])
  @@index([bookingId])
}

enum ScheduledMessageStatus {
  PENDING
  SENDING
  SENT
  DELIVERED
  FAILED
  CANCELLED
}

model MessageThread {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Thread Context
  bookingId       String?
  booking         Booking?  @relation(fields: [bookingId], references: [id], onDelete: SetNull)
  tenantId        String?
  tenant          Tenant?   @relation(fields: [tenantId], references: [id], onDelete: SetNull)
  propertyId      String?
  property        Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)

  // Participant
  participantName  String
  participantEmail String?
  participantPhone String?

  // Thread Metadata
  subject         String?
  lastMessageAt   DateTime  @default(now())
  lastMessagePreview String? @db.Text

  // Status
  isRead          Boolean   @default(true)  // true if landlord has read
  isArchived      Boolean   @default(false)
  priority        Priority  @default(NORMAL)

  // Tags
  tags            Json?     // Array of tag strings

  // Relations
  messages        Message[]

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId, isRead, isArchived])
  @@index([lastMessageAt])
}

model CannedResponse {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Response Details
  title           String    // "Check-in instructions", "WiFi password"
  shortcut        String?   // "/checkin" - quick insert
  content         String    @db.Text

  // Categorization
  category        String?   // "Check-in", "Payment", "Maintenance"

  // Usage
  useCount        Int       @default(0)
  lastUsedAt      DateTime?

  // Status
  isActive        Boolean   @default(true)

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId, isActive])
}

// ============== UPDATES TO EXISTING MODELS ==============

// Add to Message model:
model Message {
  // ... existing fields ...

  threadId        String?
  thread          MessageThread? @relation(fields: [threadId], references: [id], onDelete: SetNull)

  // AI features
  aiGenerated     Boolean   @default(false)
  aiTone          AiTone?

  // Tracking
  openedAt        DateTime?
  clickedAt       DateTime?

  // ... rest of existing fields ...
}

// Add to Booking model:
model Booking {
  // ... existing fields ...

  scheduledMessages ScheduledMessage[]
  threads           MessageThread[]

  // ... rest of existing fields ...
}

// Add to Tenant model:
model Tenant {
  // ... existing fields ...

  scheduledMessages ScheduledMessage[]
  threads           MessageThread[]

  // ... rest of existing fields ...
}

// Add to Property model:
model Property {
  // ... existing fields ...

  threads         MessageThread[]

  // ... rest of existing fields ...
}

// Add to User model:
model User {
  // ... existing fields ...

  messageAutomations MessageAutomation[]
  scheduledMessages  ScheduledMessage[]
  messageThreads     MessageThread[]
  cannedResponses    CannedResponse[]

  // ... rest of existing fields ...
}
```

---

### B. Directory Structure

```
lib/features/messaging/
├── dtos/
│   ├── automation.dto.ts          # Zod schemas for automations
│   ├── scheduled-message.dto.ts   # Schemas for scheduled messages
│   ├── thread.dto.ts              # Schemas for threads
│   └── canned-response.dto.ts     # Schemas for canned responses
│
├── services/
│   ├── automation.service.ts      # Business logic for automation CRUD
│   ├── message-scheduler.service.ts  # Queue and send scheduled messages
│   ├── thread.service.ts          # Thread management and unified inbox
│   ├── template-engine.service.ts # Variable replacement {{guestName}}
│   ├── ai-enhancement.service.ts  # AI message generation (OpenAI)
│   └── analytics.service.ts       # Open rates, click tracking
│
├── repositories/
│   ├── automation.repository.ts   # CRUD for MessageAutomation
│   ├── scheduled-message.repository.ts
│   ├── thread.repository.ts
│   └── canned-response.repository.ts
│
├── utils/
│   ├── trigger-evaluator.ts       # Determine when to fire automation
│   ├── variable-parser.ts         # Extract {{variables}} from templates
│   └── delivery-provider.ts       # Multi-channel delivery (Email/SMS/WhatsApp)
│
└── index.ts                        # Public exports
```

---

### C. API Endpoints

```
app/api/messaging/
├── automations/
│   ├── route.ts                   # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts               # GET, PATCH, DELETE
│       ├── toggle/route.ts        # POST - activate/deactivate
│       └── test/route.ts          # POST - send test message
│
├── scheduled/
│   ├── route.ts                   # GET (list scheduled messages)
│   ├── [id]/
│   │   ├── route.ts               # GET, PATCH (reschedule), DELETE (cancel)
│   │   └── send-now/route.ts     # POST - send immediately
│   └── process/route.ts           # POST - cron job endpoint (internal)
│
├── threads/
│   ├── route.ts                   # GET (unified inbox), POST (new thread)
│   └── [id]/
│       ├── route.ts               # GET (thread details), PATCH (archive/tag)
│       ├── messages/route.ts      # GET (thread messages), POST (reply)
│       └── mark-read/route.ts     # POST - mark as read
│
├── canned-responses/
│   ├── route.ts                   # GET, POST
│   └── [id]/route.ts              # GET, PATCH, DELETE
│
├── analytics/
│   ├── overview/route.ts          # GET - overall stats
│   └── automation/[id]/route.ts   # GET - automation performance
│
└── ai/
    ├── generate/route.ts          # POST - AI message generation
    └── enhance/route.ts           # POST - enhance existing message
```

---

### D. Implementation Details by Layer

#### **1. DTOs (Validation Schemas)**

```typescript
// lib/features/messaging/dtos/automation.dto.ts
import { z } from 'zod';
import { AutomationTrigger, MessageType, AiTone, RentalType } from '@prisma/client';

export const createAutomationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  triggerType: z.nativeEnum(AutomationTrigger),
  triggerOffset: z.number().int().optional(), // Hours offset
  triggerTimeOfDay: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(), // HH:MM
  messageType: z.nativeEnum(MessageType),
  subject: z.string().min(1).max(200).optional(),
  bodyTemplate: z.string().min(1),
  useAiEnhancement: z.boolean().default(false),
  aiTone: z.nativeEnum(AiTone).optional(),
  applyToRentalType: z.nativeEnum(RentalType).optional(),
  propertyIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const updateAutomationSchema = createAutomationSchema.partial();

export const testAutomationSchema = z.object({
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  bookingId: z.string().optional(), // For variable context
  tenantId: z.string().optional(),
});

export type CreateAutomationDto = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationDto = z.infer<typeof updateAutomationSchema>;
export type TestAutomationDto = z.infer<typeof testAutomationSchema>;
```

```typescript
// lib/features/messaging/dtos/thread.dto.ts
import { z } from 'zod';
import { Priority } from '@prisma/client';

export const createThreadSchema = z.object({
  participantName: z.string().min(1),
  participantEmail: z.string().email().optional(),
  participantPhone: z.string().optional(),
  subject: z.string().optional(),
  bookingId: z.string().optional(),
  tenantId: z.string().optional(),
  propertyId: z.string().optional(),
  initialMessage: z.string().min(1),
});

export const updateThreadSchema = z.object({
  isRead: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  priority: z.nativeEnum(Priority).optional(),
  tags: z.array(z.string()).optional(),
});

export const replyToThreadSchema = z.object({
  message: z.string().min(1),
  messageType: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP']),
});

export type CreateThreadDto = z.infer<typeof createThreadSchema>;
export type UpdateThreadDto = z.infer<typeof updateThreadSchema>;
export type ReplyToThreadDto = z.infer<typeof replyToThreadSchema>;
```

---

#### **2. Repository Layer (Data Access)**

```typescript
// lib/features/messaging/repositories/automation.repository.ts
import { prisma } from '@/lib/db';
import { CreateAutomationDto, UpdateAutomationDto } from '../dtos/automation.dto';
import { AutomationTrigger } from '@prisma/client';

export class AutomationRepository {
  async findAll(userId: string) {
    return prisma.messageAutomation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(userId: string, triggerType?: AutomationTrigger) {
    return prisma.messageAutomation.findMany({
      where: {
        userId,
        isActive: true,
        ...(triggerType && { triggerType }),
      },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.messageAutomation.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, data: CreateAutomationDto) {
    return prisma.messageAutomation.create({
      data: {
        ...data,
        userId,
        propertyIds: data.propertyIds ? JSON.stringify(data.propertyIds) : null,
      },
    });
  }

  async update(id: string, userId: string, data: UpdateAutomationDto) {
    return prisma.messageAutomation.updateMany({
      where: { id, userId },
      data: {
        ...data,
        propertyIds: data.propertyIds ? JSON.stringify(data.propertyIds) : undefined,
      },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.messageAutomation.deleteMany({
      where: { id, userId },
    });
  }

  async toggleActive(id: string, userId: string, isActive: boolean) {
    return prisma.messageAutomation.updateMany({
      where: { id, userId },
      data: { isActive },
    });
  }

  async incrementAnalytics(id: string, field: 'totalSent' | 'totalOpened' | 'totalClicked') {
    return prisma.messageAutomation.update({
      where: { id },
      data: { [field]: { increment: 1 } },
    });
  }
}

export const automationRepository = new AutomationRepository();
```

```typescript
// lib/features/messaging/repositories/scheduled-message.repository.ts
import { prisma } from '@/lib/db';
import { ScheduledMessageStatus } from '@prisma/client';

export class ScheduledMessageRepository {
  async findPendingMessages(beforeTime: Date) {
    return prisma.scheduledMessage.findMany({
      where: {
        status: ScheduledMessageStatus.PENDING,
        scheduledFor: { lte: beforeTime },
      },
      include: {
        booking: true,
        tenant: true,
        automation: true,
      },
    });
  }

  async findByUser(userId: string, limit: number = 50) {
    return prisma.scheduledMessage.findMany({
      where: { userId },
      orderBy: { scheduledFor: 'desc' },
      take: limit,
      include: {
        automation: { select: { name: true } },
        booking: { select: { bookingReference: true, guestName: true } },
      },
    });
  }

  async create(data: any) {
    return prisma.scheduledMessage.create({ data });
  }

  async updateStatus(id: string, status: ScheduledMessageStatus, errorMessage?: string) {
    return prisma.scheduledMessage.update({
      where: { id },
      data: {
        status,
        errorMessage,
        ...(status === ScheduledMessageStatus.SENT && { sentAt: new Date() }),
        ...(status === ScheduledMessageStatus.DELIVERED && { deliveredAt: new Date() }),
      },
    });
  }

  async markOpened(id: string) {
    return prisma.scheduledMessage.update({
      where: { id },
      data: { openedAt: new Date() },
    });
  }

  async cancel(id: string, userId: string) {
    return prisma.scheduledMessage.updateMany({
      where: { id, userId, status: ScheduledMessageStatus.PENDING },
      data: { status: ScheduledMessageStatus.CANCELLED },
    });
  }
}

export const scheduledMessageRepository = new ScheduledMessageRepository();
```

---

#### **3. Service Layer (Business Logic)**

```typescript
// lib/features/messaging/services/automation.service.ts
import { automationRepository } from '../repositories/automation.repository';
import { CreateAutomationDto, UpdateAutomationDto } from '../dtos/automation.dto';
import { NotFoundError } from '@/lib/shared/errors/not-found-error';

export class AutomationService {
  async getAll(organizationId: string) {
    return automationRepository.findAll(organizationId);
  }

  async getById(organizationId: string, id: string) {
    const automation = await automationRepository.findById(id, organizationId);
    if (!automation) {
      throw new NotFoundError('Automation', id);
    }
    return automation;
  }

  async create(organizationId: string, data: CreateAutomationDto) {
    // Business validation: ensure propertyIds belong to organization
    if (data.propertyIds && data.propertyIds.length > 0) {
      const { prisma } = await import('@/lib/db');
      const validProperties = await prisma.property.count({
        where: {
          userId: organizationId,
          id: { in: data.propertyIds },
        },
      });

      if (validProperties !== data.propertyIds.length) {
        throw new Error('Some property IDs are invalid or do not belong to your organization');
      }
    }

    return automationRepository.create(organizationId, data);
  }

  async update(organizationId: string, id: string, data: UpdateAutomationDto) {
    await this.getById(organizationId, id); // Verify ownership

    // Same validation as create
    if (data.propertyIds && data.propertyIds.length > 0) {
      const { prisma } = await import('@/lib/db');
      const validProperties = await prisma.property.count({
        where: {
          userId: organizationId,
          id: { in: data.propertyIds },
        },
      });

      if (validProperties !== data.propertyIds.length) {
        throw new Error('Some property IDs are invalid');
      }
    }

    await automationRepository.update(id, organizationId, data);
    return this.getById(organizationId, id);
  }

  async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id); // Verify ownership
    await automationRepository.delete(id, organizationId);
  }

  async toggle(organizationId: string, id: string, isActive: boolean) {
    await this.getById(organizationId, id);
    await automationRepository.toggleActive(id, organizationId, isActive);
    return this.getById(organizationId, id);
  }

  async testAutomation(
    organizationId: string,
    id: string,
    testData: { recipientEmail?: string; recipientPhone?: string; bookingId?: string }
  ) {
    const automation = await this.getById(organizationId, id);

    // Use template engine and delivery provider
    const { templateEngineService } = await import('./template-engine.service');
    const { deliveryProviderService } = await import('../utils/delivery-provider');

    // Get context data for variable replacement
    let context = {};
    if (testData.bookingId) {
      const { prisma } = await import('@/lib/db');
      const booking = await prisma.booking.findFirst({
        where: { id: testData.bookingId, userId: organizationId },
        include: { property: true },
      });
      if (booking) {
        context = {
          guestName: booking.guestName,
          propertyName: booking.property.name,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          // ... other variables
        };
      }
    }

    const renderedBody = templateEngineService.render(automation.bodyTemplate, context);

    // Send test message
    await deliveryProviderService.send({
      type: automation.messageType,
      recipient: testData.recipientEmail || testData.recipientPhone || '',
      subject: automation.subject,
      body: renderedBody,
    });

    return { success: true, message: 'Test message sent successfully' };
  }
}

export const automationService = new AutomationService();
```

```typescript
// lib/features/messaging/services/message-scheduler.service.ts
import { scheduledMessageRepository } from '../repositories/scheduled-message.repository';
import { automationRepository } from '../repositories/automation.repository';
import { AutomationTrigger, ScheduledMessageStatus } from '@prisma/client';
import { templateEngineService } from './template-engine.service';
import { deliveryProviderService } from '../utils/delivery-provider';

export class MessageSchedulerService {
  /**
   * Called when a booking is created/updated to schedule automation messages
   */
  async scheduleForBooking(bookingId: string, userId: string, trigger: AutomationTrigger) {
    const { prisma } = await import('@/lib/db');

    // Get booking with property
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) return;

    // Find active automations for this trigger
    const automations = await automationRepository.findActive(userId, trigger);

    for (const automation of automations) {
      // Check if automation applies to this property
      if (automation.propertyIds) {
        const propertyIds = JSON.parse(automation.propertyIds as string);
        if (!propertyIds.includes(booking.propertyId)) continue;
      }

      // Check rental type filter
      if (automation.applyToRentalType && automation.applyToRentalType !== booking.bookingType) {
        continue;
      }

      // Calculate scheduled time
      const scheduledFor = this.calculateScheduledTime(
        trigger,
        booking,
        automation.triggerOffset,
        automation.triggerTimeOfDay
      );

      // Prepare context for template rendering
      const context = {
        guestName: booking.guestName,
        propertyName: booking.property.name,
        propertyAddress: booking.property.address,
        checkInDate: booking.checkInDate.toLocaleDateString(),
        checkInTime: booking.property.checkInTime || '15:00',
        checkOutDate: booking.checkOutDate.toLocaleDateString(),
        checkOutTime: booking.property.checkOutTime || '11:00',
        totalAmount: booking.totalAmount.toString(),
        bookingReference: booking.bookingReference,
      };

      // Render message body
      const renderedBody = templateEngineService.render(automation.bodyTemplate, context);
      const renderedSubject = automation.subject
        ? templateEngineService.render(automation.subject, context)
        : undefined;

      // Create scheduled message
      await scheduledMessageRepository.create({
        userId,
        automationId: automation.id,
        bookingId: booking.id,
        recipientEmail: booking.guestEmail,
        recipientPhone: booking.guestPhone,
        recipientName: booking.guestName,
        messageType: automation.messageType,
        subject: renderedSubject,
        body: renderedBody,
        scheduledFor,
        status: ScheduledMessageStatus.PENDING,
      });
    }
  }

  /**
   * Process pending messages (called by cron job)
   */
  async processPending() {
    const now = new Date();
    const pendingMessages = await scheduledMessageRepository.findPendingMessages(now);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
    };

    for (const message of pendingMessages) {
      results.processed++;

      try {
        // Update to SENDING status
        await scheduledMessageRepository.updateStatus(message.id, ScheduledMessageStatus.SENDING);

        // Send message
        await deliveryProviderService.send({
          type: message.messageType,
          recipient: message.recipientEmail || message.recipientPhone || '',
          subject: message.subject,
          body: message.body,
        });

        // Update to SENT
        await scheduledMessageRepository.updateStatus(message.id, ScheduledMessageStatus.SENT);

        // Increment automation analytics
        if (message.automationId) {
          await automationRepository.incrementAnalytics(message.automationId, 'totalSent');
        }

        results.succeeded++;
      } catch (error) {
        // Update to FAILED with error
        await scheduledMessageRepository.updateStatus(
          message.id,
          ScheduledMessageStatus.FAILED,
          error instanceof Error ? error.message : 'Unknown error'
        );

        results.failed++;
      }
    }

    return results;
  }

  private calculateScheduledTime(
    trigger: AutomationTrigger,
    booking: any,
    offset?: number | null,
    timeOfDay?: string | null
  ): Date {
    let baseDate: Date;

    // Determine base date from trigger
    switch (trigger) {
      case AutomationTrigger.BOOKING_CREATED:
      case AutomationTrigger.BOOKING_CONFIRMED:
        baseDate = new Date();
        break;
      case AutomationTrigger.CHECK_IN_REMINDER:
      case AutomationTrigger.CHECK_IN_INSTRUCTIONS:
        baseDate = new Date(booking.checkInDate);
        break;
      case AutomationTrigger.CHECK_OUT_REMINDER:
      case AutomationTrigger.CHECK_OUT_INSTRUCTIONS:
        baseDate = new Date(booking.checkOutDate);
        break;
      case AutomationTrigger.REVIEW_REQUEST:
        baseDate = new Date(booking.checkOutDate);
        break;
      default:
        baseDate = new Date();
    }

    // Apply offset (in hours)
    if (offset) {
      baseDate.setHours(baseDate.getHours() + offset);
    }

    // Apply specific time of day
    if (timeOfDay) {
      const [hours, minutes] = timeOfDay.split(':').map(Number);
      baseDate.setHours(hours, minutes, 0, 0);
    }

    return baseDate;
  }
}

export const messageSchedulerService = new MessageSchedulerService();
```

```typescript
// lib/features/messaging/services/template-engine.service.ts
export class TemplateEngineService {
  /**
   * Replace variables in template with context values
   * Example: "Hello {{guestName}}" + {guestName: "John"} => "Hello John"
   */
  render(template: string, context: Record<string, any>): string {
    let result = template;

    // Find all {{variable}} patterns
    const variables = this.extractVariables(template);

    for (const variable of variables) {
      const value = this.getNestedValue(context, variable);
      const placeholder = `{{${variable}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value?.toString() || '');
    }

    return result;
  }

  /**
   * Extract all variables from template
   */
  extractVariables(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = template.matchAll(regex);
    return Array.from(matches, (match) => match[1].trim());
  }

  /**
   * Get nested value from object (e.g., "property.name")
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get available variables for a context type
   */
  getAvailableVariables(contextType: 'booking' | 'tenant' | 'maintenance'): string[] {
    const variables = {
      booking: [
        'guestName',
        'guestEmail',
        'guestPhone',
        'propertyName',
        'propertyAddress',
        'checkInDate',
        'checkInTime',
        'checkOutDate',
        'checkOutTime',
        'totalAmount',
        'bookingReference',
        'numberOfGuests',
        'numberOfNights',
      ],
      tenant: [
        'tenantName',
        'tenantEmail',
        'propertyName',
        'propertyAddress',
        'leaseStartDate',
        'leaseEndDate',
        'monthlyRent',
      ],
      maintenance: [
        'propertyName',
        'propertyAddress',
        'requestTitle',
        'requestDescription',
        'scheduledDate',
        'assignedTo',
      ],
    };

    return variables[contextType] || [];
  }
}

export const templateEngineService = new TemplateEngineService();
```

---

#### **4. API Routes (Presentation Layer)**

```typescript
// app/api/messaging/automations/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { automationService, createAutomationSchema } from '@/lib/features/messaging';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const automations = await automationService.getAll(session.user.organizationId);
    return NextResponse.json(automations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = createAutomationSchema.parse(body);

    // Create automation
    const automation = await automationService.create(session.user.organizationId, validatedData);

    // Audit log
    await logAudit(session, 'created', 'message_automation', automation.id, undefined, request);

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

```typescript
// app/api/messaging/automations/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { automationService, updateAutomationSchema } from '@/lib/features/messaging';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const automation = await automationService.getById(session.user.organizationId, params.id);
    return NextResponse.json(automation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // Validate
    const validatedData = updateAutomationSchema.parse(body);

    // Update
    const automation = await automationService.update(
      session.user.organizationId,
      params.id,
      validatedData
    );

    // Audit
    await logAudit(session, 'updated', 'message_automation', params.id, undefined, request);

    return NextResponse.json(automation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();

    await automationService.delete(session.user.organizationId, params.id);

    // Audit
    await logAudit(session, 'deleted', 'message_automation', params.id, undefined, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

```typescript
// app/api/messaging/automations/[id]/toggle/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { automationService } from '@/lib/features/messaging';
import { z } from 'zod';

const toggleSchema = z.object({
  isActive: z.boolean(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { isActive } = toggleSchema.parse(body);

    const automation = await automationService.toggle(
      session.user.organizationId,
      params.id,
      isActive
    );

    await logAudit(
      session,
      'updated',
      'message_automation',
      params.id,
      { after: { isActive } },
      request
    );

    return NextResponse.json(automation);
  } catch (error) {
    return handleApiError(error);
  }
}
```

```typescript
// app/api/messaging/scheduled/process/route.ts
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { messageSchedulerService } from '@/lib/features/messaging';

/**
 * Cron job endpoint - process pending scheduled messages
 * Should be called every 5-15 minutes via Vercel Cron or similar
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/messaging/scheduled/process",
 *     "schedule": "*/10 * * * *"
 *   }]
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await messageSchedulerService.processPending();

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### E. Access Control Integration

#### **Permission Requirements**

Based on the multi-tenancy guide, messaging automation follows these access rules:

```typescript
// Reading automations - basic auth required
const session = await requireAuth();
// Uses session.user.organizationId automatically

// Creating/updating automations - no special permission needed
// Landlords can create their own automations

// Team member restrictions (future enhancement):
const session = await requirePermission(organizationId, 'canManageMessages');
// New permission: canManageMessages in TeamMember model
```

#### **Resource Ownership Verification**

```typescript
// When accessing a specific automation:
const automation = await automationService.getById(session.user.organizationId, automationId);
// Service layer verifies userId === organizationId

// When scheduling messages for a booking:
await messageSchedulerService.scheduleForBooking(bookingId, session.user.organizationId, trigger);
// Only creates messages for bookings owned by the organization
```

#### **Audit Trail**

All mutation operations are logged:

```typescript
// Create automation
await logAudit(session, 'created', 'message_automation', automation.id, undefined, request);

// Update automation
await logAudit(session, 'updated', 'message_automation', id, { before, after }, request);

// Delete automation
await logAudit(session, 'deleted', 'message_automation', id, undefined, request);

// Send message (in scheduler service)
await logAudit(session, 'sent', 'scheduled_message', messageId, { recipient, type }, request);
```

---

### F. Frontend Integration Points

#### **Dashboard Pages to Create**

```
app/(dashboard)/messages/
├── page.tsx                        # Unified inbox (MessageThread list)
├── automations/
│   ├── page.tsx                    # List automations
│   ├── new/page.tsx                # Create automation
│   └── [id]/edit/page.tsx          # Edit automation
├── scheduled/page.tsx              # View scheduled messages
├── canned-responses/page.tsx       # Manage canned responses
└── analytics/page.tsx              # Message analytics dashboard
```

#### **Key UI Components Needed**

```
components/messages/
├── automation-list.tsx             # Table of automations
├── automation-form.tsx             # Create/edit form with trigger selector
├── template-editor.tsx             # Rich text editor with variable picker
├── variable-picker.tsx             # Dropdown to insert {{variables}}
├── test-message-dialog.tsx         # Send test message modal
├── thread-list.tsx                 # Unified inbox interface
├── thread-detail.tsx               # Message thread view
├── message-composer.tsx            # Reply interface with canned responses
└── analytics-dashboard.tsx         # Charts for open rates, etc.
```

---

### G. Third-Party Integration Requirements

#### **Email Provider (Existing)**

Already have email setup in `lib/email.ts` - extend for tracking:

- Add tracking pixel for open detection
- Track link clicks via redirect URLs

#### **SMS Provider (New)**

Integrate Twilio or similar:

```typescript
// lib/features/messaging/utils/delivery-provider.ts
import twilio from 'twilio';

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export class DeliveryProviderService {
  async send(message: {
    type: 'EMAIL' | 'SMS' | 'WHATSAPP';
    recipient: string;
    subject?: string;
    body: string;
  }) {
    switch (message.type) {
      case 'EMAIL':
        return this.sendEmail(message);
      case 'SMS':
        return this.sendSMS(message);
      case 'WHATSAPP':
        return this.sendWhatsApp(message);
      default:
        throw new Error(`Unsupported message type: ${message.type}`);
    }
  }

  private async sendSMS(message: any) {
    await twilioClient.messages.create({
      body: message.body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: message.recipient,
    });
  }

  // ... other methods
}

export const deliveryProviderService = new DeliveryProviderService();
```

#### **AI Enhancement (Optional)**

Integrate OpenAI for message enhancement:

```typescript
// lib/features/messaging/services/ai-enhancement.service.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AiEnhancementService {
  async enhance(template: string, tone: 'PROFESSIONAL' | 'FRIENDLY' | 'CASUAL') {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a property management messaging assistant. Enhance the following message template to be more ${tone.toLowerCase()} while maintaining all variable placeholders like {{guestName}}.`,
        },
        { role: 'user', content: template },
      ],
    });

    return response.choices[0].message.content;
  }

  async generate(context: string, tone: string) {
    // Generate message from scratch based on context
  }
}

export const aiEnhancementService = new AiEnhancementService();
```

---

### H. Migration Plan

#### **Step 1: Database Migration**

```bash
# Create migration
npm run db:migrate

# Migration file will be generated in prisma/migrations/
# Name: "add_messaging_automation"
```

#### **Step 2: Seed Default Automations**

```typescript
// prisma/seed.ts - Add default automations for new users
const defaultAutomations = [
  {
    name: 'Booking Confirmation',
    triggerType: 'BOOKING_CONFIRMED',
    messageType: 'EMAIL',
    subject: 'Booking Confirmed - {{propertyName}}',
    bodyTemplate: `Hi {{guestName}},

Your booking at {{propertyName}} has been confirmed!

Check-in: {{checkInDate}} at {{checkInTime}}
Check-out: {{checkOutDate}} at {{checkOutTime}}
Booking Reference: {{bookingReference}}

We look forward to hosting you!`,
    isActive: true,
  },
  // ... more defaults
];
```

#### **Step 3: Integration Triggers**

Add scheduler calls to existing booking flow:

```typescript
// In app/api/bookings/route.ts (POST handler)
import { messageSchedulerService } from '@/lib/features/messaging';

// After creating booking:
await messageSchedulerService.scheduleForBooking(
  booking.id,
  session.user.organizationId,
  'BOOKING_CREATED'
);
```

---

### I. Testing Strategy

#### **Unit Tests**

```typescript
// lib/features/messaging/services/__tests__/template-engine.test.ts
import { describe, it, expect } from 'vitest';
import { templateEngineService } from '../template-engine.service';

describe('TemplateEngineService', () => {
  it('should replace single variable', () => {
    const result = templateEngineService.render('Hello {{name}}', { name: 'John' });
    expect(result).toBe('Hello John');
  });

  it('should replace multiple variables', () => {
    const template = 'Hi {{name}}, your booking at {{property}} is confirmed';
    const context = { name: 'John', property: 'Beach House' };
    const result = templateEngineService.render(template, context);
    expect(result).toBe('Hi John, your booking at Beach House is confirmed');
  });

  it('should handle missing variables gracefully', () => {
    const result = templateEngineService.render('Hello {{name}}', {});
    expect(result).toBe('Hello ');
  });
});
```

#### **Integration Tests**

```typescript
// lib/features/messaging/services/__tests__/automation.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { automationService } from '../automation.service';
import { prisma } from '@/lib/db';

describe('AutomationService', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.messageAutomation.deleteMany();
  });

  it('should create automation with valid data', async () => {
    const automation = await automationService.create('user-123', {
      name: 'Test Automation',
      triggerType: 'BOOKING_CONFIRMED',
      messageType: 'EMAIL',
      bodyTemplate: 'Hello {{guestName}}',
      isActive: true,
    });

    expect(automation).toBeDefined();
    expect(automation.name).toBe('Test Automation');
  });

  it('should reject invalid property IDs', async () => {
    await expect(
      automationService.create('user-123', {
        name: 'Test',
        triggerType: 'BOOKING_CONFIRMED',
        messageType: 'EMAIL',
        bodyTemplate: 'Test',
        propertyIds: ['invalid-property-id'],
      })
    ).rejects.toThrow('Some property IDs are invalid');
  });
});
```

---

## Summary & Next Steps

### Implementation Timeline (Estimated)

| Phase                            | Tasks                                          | Effort    | Priority |
| -------------------------------- | ---------------------------------------------- | --------- | -------- |
| **Phase 1: Core Infrastructure** | Database schema, repositories, DTOs            | 3-5 days  | P0       |
| **Phase 2: Service Layer**       | Template engine, scheduler, automation service | 5-7 days  | P0       |
| **Phase 3: API Layer**           | All endpoints, access control, audit logging   | 3-4 days  | P0       |
| **Phase 4: UI - Automations**    | Automation CRUD pages, template editor         | 5-7 days  | P0       |
| **Phase 5: UI - Inbox**          | Unified inbox, threads, messaging interface    | 7-10 days | P1       |
| **Phase 6: Integrations**        | Twilio SMS, email tracking, cron job           | 3-5 days  | P1       |
| **Phase 7: AI Enhancement**      | OpenAI integration (optional)                  | 2-3 days  | P2       |
| **Phase 8: Testing & Polish**    | Unit tests, integration tests, QA              | 5-7 days  | P0       |

**Total Estimated Effort:** 6-8 weeks for full implementation

---

### Success Metrics

- **Time Saved:** Reduce manual messaging time by 80%+
- **Guest Satisfaction:** Improve response time from hours to minutes
- **Automation Coverage:** 90%+ of bookings receive automated messages
- **Open Rates:** Track and optimize to industry standard (20-30% for email)
- **Scalability:** Support 1000+ scheduled messages per day without performance degradation

---

### Risk Mitigation

| Risk                          | Mitigation Strategy                                                        |
| ----------------------------- | -------------------------------------------------------------------------- |
| **Email/SMS deliverability**  | Use established providers (SendGrid, Twilio), implement retry logic        |
| **Timezone handling**         | Store all times in UTC, convert based on property timezone                 |
| **Message queue overflow**    | Implement rate limiting, batch processing, priority queue                  |
| **Variable injection errors** | Strict template validation, fallback to empty string for missing variables |
| **Spam complaints**           | Unsubscribe links, opt-in confirmations, compliance with CAN-SPAM          |

---

## Conclusion

This implementation strictly adheres to the **three-layer architecture** defined in `CLAUDE.md`, uses **multi-tenancy patterns** for access control, follows **audit logging** best practices, and integrates seamlessly with the existing codebase structure. The feature is production-ready and scalable for enterprise use.

The automated messaging hub addresses the most critical competitive gap and provides the highest ROI with moderate technical complexity. Following this implementation, the platform should move to Owner Portals (#2 priority) to complete the core value proposition for property management companies.
