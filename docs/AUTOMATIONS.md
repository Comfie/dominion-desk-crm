# Automations & Messaging System

This document provides comprehensive documentation for the automated messaging system in the Property CRM application.

## Table of Contents

1. [Overview](#overview)
2. [Data Model](#data-model)
3. [Supported Triggers](#supported-triggers)
4. [Message Channels](#message-channels)
5. [Template Variables](#template-variables)
6. [Message Scheduling & Processing](#message-scheduling--processing)
7. [Cron Job Schedule](#cron-job-schedule)
8. [Architecture](#architecture)
9. [Example Workflow](#example-workflow)
10. [File Locations Reference](#file-locations-reference)

---

## Overview

The automations system enables property managers to create automated messages that are triggered by various events in the property management lifecycle. Messages can be sent via multiple channels (email, SMS, WhatsApp) and support dynamic content through template variables.

**Key Features:**

- Event-driven message automation
- Multiple delivery channels
- Template-based content with variable substitution
- Configurable timing with offsets and time-of-day scheduling
- Property and rental type filtering
- Analytics tracking (sent, opened, clicked)
- Test mode for previewing messages before deployment

---

## Data Model

### MessageAutomation

The core entity that defines an automated message workflow.

```prisma
model MessageAutomation {
  id                String              @id @default(cuid())
  userId            String              // Organization ID

  // Core details
  name              String
  description       String?             @db.Text

  // Trigger configuration
  triggerType       AutomationTrigger   // When to send
  triggerOffset     Int?                // Hours before/after trigger event
  triggerTimeOfDay  String?             // HH:MM format for specific send time

  // Message configuration
  messageType       MessageType         // EMAIL, SMS, WHATSAPP, IN_APP
  subject           String?             // For email
  bodyTemplate      String              @db.Text  // Template with {{variables}}

  // AI features
  useAiEnhancement  Boolean             @default(false)
  aiTone            AiTone?             // PROFESSIONAL, FRIENDLY, etc.

  // Targeting
  applyToRentalType RentalType?         // LONG_TERM, SHORT_TERM, BOTH
  propertyIds       Json?               // Array of property IDs

  // Status
  isActive          Boolean             @default(true)

  // Analytics
  totalSent         Int                 @default(0)
  totalOpened       Int                 @default(0)
  totalClicked      Int                 @default(0)

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  scheduledMessages ScheduledMessage[]
}
```

### ScheduledMessage

Individual messages queued for delivery.

```prisma
model ScheduledMessage {
  id              String                  @id @default(cuid())
  userId          String
  automationId    String?                 // Reference to parent automation

  // Target entity (one will be set)
  bookingId       String?
  tenantId        String?

  // Recipient details
  recipientEmail  String?
  recipientPhone  String?
  recipientName   String

  // Message content
  messageType     MessageType
  subject         String?
  body            String                  @db.Text

  // Scheduling
  scheduledFor    DateTime                // When to send
  sentAt          DateTime?

  // Status tracking
  status          ScheduledMessageStatus  // PENDING, SENDING, SENT, etc.
  errorMessage    String?                 @db.Text

  // Delivery tracking
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?

  // Response tracking
  repliedAt       DateTime?
  replyText       String?                 @db.Text

  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
}
```

### Message Status Flow

```
PENDING → SENDING → SENT → DELIVERED
                  ↘ FAILED

CANCELLED (user cancelled before sending)
```

---

## Supported Triggers

### AutomationTrigger Enum

| Trigger                  | Description                           | Base Date      | Default Offset     |
| ------------------------ | ------------------------------------- | -------------- | ------------------ |
| `BOOKING_CREATED`        | Fires when a booking is created       | Now            | 0 hrs              |
| `BOOKING_CONFIRMED`      | Fires when booking status → CONFIRMED | Now            | 0 hrs              |
| `CHECK_IN_REMINDER`      | Reminder before check-in              | Check-in date  | -24 hrs            |
| `CHECK_IN_INSTRUCTIONS`  | Instructions just before check-in     | Check-in date  | -2 hrs             |
| `CHECK_OUT_REMINDER`     | Reminder before check-out             | Check-out date | -24 hrs            |
| `CHECK_OUT_INSTRUCTIONS` | Instructions after check-out          | Check-out date | +24 hrs            |
| `BOOKING_COMPLETED`      | Fires when booking is marked complete | Now            | 0 hrs              |
| `PAYMENT_REMINDER`       | Reminder before payment due date      | Due date       | -72 hrs            |
| `PAYMENT_RECEIVED`       | Fires when payment is marked PAID     | Now            | 0 hrs              |
| `PAYMENT_OVERDUE`        | Fires when payment becomes overdue    | Overdue date   | +24 hrs            |
| `MAINTENANCE_SCHEDULED`  | Fires when maintenance is scheduled   | Now            | 0 hrs              |
| `MAINTENANCE_COMPLETED`  | Fires when maintenance is completed   | Now            | 0 hrs              |
| `REVIEW_REQUEST`         | Request for booking review            | Check-out date | +48 hrs            |
| `LEASE_RENEWAL_REMINDER` | Reminder for lease renewal            | Lease end date | -720 hrs (30 days) |
| `CUSTOM_DATE`            | Custom date trigger (future)          | Custom date    | Configurable       |

### Trigger Offset

The `triggerOffset` field specifies hours relative to the base date:

- **Negative values**: Send before the event (e.g., -24 = 24 hours before)
- **Positive values**: Send after the event (e.g., +48 = 48 hours after)
- **Zero or null**: Send immediately when event occurs

### Time of Day Override

The `triggerTimeOfDay` field (format: `HH:MM`) overrides the time portion:

- If set, the message will be scheduled for that specific time
- Useful for sending messages at appropriate hours (e.g., not at 3 AM)

---

## Message Channels

### MessageType Enum

| Channel    | Status      | Implementation                      |
| ---------- | ----------- | ----------------------------------- |
| `EMAIL`    | Implemented | Gmail SMTP via `sendEmail()`        |
| `SMS`      | Planned     | Twilio integration (stub exists)    |
| `WHATSAPP` | Planned     | WhatsApp Business API (stub exists) |
| `IN_APP`   | Partial     | Creates Message records             |

### Email Configuration

Email delivery uses Gmail SMTP. Required environment variables:

```bash
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

### Future Channel Configuration

```bash
# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp Business API
# Configuration TBD
```

---

## Template Variables

Templates use `{{variableName}}` syntax (Handlebars-style). Variables are replaced with actual data when the message is rendered.

### Booking Context Variables

Available for: `BOOKING_CREATED`, `BOOKING_CONFIRMED`, `CHECK_IN_*`, `CHECK_OUT_*`, `REVIEW_REQUEST`, `BOOKING_COMPLETED`

| Variable               | Type   | Description                    |
| ---------------------- | ------ | ------------------------------ |
| `{{guestName}}`        | string | Guest full name                |
| `{{guestEmail}}`       | string | Guest email address            |
| `{{guestPhone}}`       | string | Guest phone number             |
| `{{propertyName}}`     | string | Property name                  |
| `{{propertyAddress}}`  | string | Full property address          |
| `{{checkInDate}}`      | string | Formatted check-in date        |
| `{{checkInTime}}`      | string | Check-in time (e.g., "15:00")  |
| `{{checkOutDate}}`     | string | Formatted check-out date       |
| `{{checkOutTime}}`     | string | Check-out time (e.g., "11:00") |
| `{{totalAmount}}`      | string | Total booking amount           |
| `{{bookingReference}}` | string | Booking reference number       |
| `{{numberOfGuests}}`   | string | Number of guests               |
| `{{numberOfNights}}`   | string | Number of nights               |

### Tenant/Lease Context Variables

Available for: `PAYMENT_REMINDER`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `LEASE_RENEWAL_REMINDER`

| Variable               | Type   | Description                       |
| ---------------------- | ------ | --------------------------------- |
| `{{tenantName}}`       | string | Tenant full name                  |
| `{{tenantEmail}}`      | string | Tenant email address              |
| `{{propertyName}}`     | string | Property name                     |
| `{{propertyAddress}}`  | string | Full property address             |
| `{{leaseStartDate}}`   | string | Lease start date                  |
| `{{leaseEndDate}}`     | string | Lease end date                    |
| `{{monthlyRent}}`      | string | Monthly rent amount               |
| `{{amount}}`           | string | Payment amount (payment triggers) |
| `{{dueDate}}`          | string | Payment due date                  |
| `{{paymentReference}}` | string | Payment reference number          |

### Maintenance Context Variables

Available for: `MAINTENANCE_SCHEDULED`, `MAINTENANCE_COMPLETED`

| Variable                 | Type   | Description               |
| ------------------------ | ------ | ------------------------- |
| `{{propertyName}}`       | string | Property name             |
| `{{propertyAddress}}`    | string | Full property address     |
| `{{requestTitle}}`       | string | Maintenance request title |
| `{{requestDescription}}` | string | Request description       |
| `{{scheduledDate}}`      | string | Scheduled date            |
| `{{assignedTo}}`         | string | Assigned contractor name  |

### Example Template

```
Hi {{guestName}},

Welcome to {{propertyName}}! We're excited to host you.

Your check-in details:
- Date: {{checkInDate}}
- Time: {{checkInTime}}
- Address: {{propertyAddress}}

Your booking reference is {{bookingReference}}.

See you soon!
```

---

## Message Scheduling & Processing

### Scheduling Flow

```
┌─────────────────┐
│  Event Occurs   │  (booking created, payment received, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Find Active    │  Query automations matching:
│  Automations    │  - Trigger type
│                 │  - User/Organization
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Apply Filters  │  Check:
│                 │  - Rental type match
│                 │  - Property ID restrictions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Calculate      │  Apply:
│  Send Time      │  - Trigger offset (hours)
│                 │  - Time of day override
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Render         │  Replace {{variables}}
│  Template       │  with actual data
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Create         │  Insert with
│  ScheduledMsg   │  status = PENDING
└─────────────────┘
```

### Processing Flow (Cron Job)

```
┌─────────────────┐
│  Cron Trigger   │  Every 15 minutes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Find Pending   │  WHERE status = PENDING
│  Messages       │  AND scheduledFor <= NOW
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  For Each Msg   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Set    │ │Send   │
│SENDING│→│Message│
└───────┘ └───┬───┘
              │
         ┌────┴────┐
         ▼         ▼
    ┌───────┐ ┌───────┐
    │ SENT  │ │FAILED │
    └───────┘ └───────┘
```

---

## Cron Job Schedule

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/messaging/scheduled/process",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

| Setting        | Value                              | Description               |
| -------------- | ---------------------------------- | ------------------------- |
| Path           | `/api/messaging/scheduled/process` | Processing endpoint       |
| Schedule       | `*/15 * * * *`                     | Every 15 minutes          |
| Authentication | Bearer token                       | Via `CRON_SECRET` env var |

### Required Environment Variable

```bash
CRON_SECRET=your_secure_random_string
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

### Manual Trigger

```bash
curl -X POST https://your-domain.com/api/messaging/scheduled/process \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### Response Format

```json
{
  "success": true,
  "processed": 45,
  "succeeded": 43,
  "failed": 2
}
```

---

## Architecture

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Property CRM                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │
│  │   Booking    │     │   Payment    │     │ Maintenance  │               │
│  │     API      │     │     API      │     │     API      │               │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘               │
│         │                    │                    │                        │
│         └────────────────────┼────────────────────┘                        │
│                              │                                             │
│                              ▼                                             │
│                    ┌──────────────────┐                                    │
│                    │ MessageScheduler │                                    │
│                    │     Service      │                                    │
│                    └────────┬─────────┘                                    │
│                             │                                              │
│              ┌──────────────┼──────────────┐                               │
│              ▼              ▼              ▼                               │
│     ┌────────────┐  ┌─────────────┐  ┌────────────┐                        │
│     │ Automation │  │  Template   │  │ Scheduled  │                        │
│     │ Repository │  │   Engine    │  │  Message   │                        │
│     │            │  │   Service   │  │ Repository │                        │
│     └──────┬─────┘  └─────────────┘  └─────┬──────┘                        │
│            │                               │                               │
│            └───────────────┬───────────────┘                               │
│                            ▼                                               │
│                    ┌──────────────┐                                        │
│                    │   Database   │                                        │
│                    │  (Postgres)  │                                        │
│                    └──────────────┘                                        │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                           Cron Job (Every 15 min)                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────┐                                                      │
│  │ /api/messaging/  │                                                      │
│  │ scheduled/process│                                                      │
│  └────────┬─────────┘                                                      │
│           │                                                                │
│           ▼                                                                │
│  ┌──────────────────┐     ┌──────────────────────────────────────┐        │
│  │ MessageScheduler │────▶│         Delivery Provider            │        │
│  │  .processPending │     ├──────────┬───────────┬───────────────┤        │
│  └──────────────────┘     │  Email   │    SMS    │   WhatsApp    │        │
│                           │  (SMTP)  │ (Twilio)  │ (Business API)│        │
│                           └──────────┴───────────┴───────────────┘        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component                      | Responsibility                               |
| ------------------------------ | -------------------------------------------- |
| **MessageSchedulerService**    | Coordinates scheduling and processing        |
| **TemplateEngineService**      | Renders templates with variable substitution |
| **AutomationRepository**       | CRUD operations for automations              |
| **ScheduledMessageRepository** | CRUD operations for scheduled messages       |
| **DeliveryProvider**           | Routes messages to appropriate channel       |

---

## Example Workflow

### Booking Confirmation Email

**Scenario:** A guest creates a new booking, and we want to send a confirmation email immediately.

#### 1. Create the Automation

```bash
POST /api/messaging/automations
Content-Type: application/json

{
  "name": "Booking Confirmation",
  "description": "Send confirmation email when a booking is created",
  "triggerType": "BOOKING_CREATED",
  "triggerOffset": 0,
  "messageType": "EMAIL",
  "subject": "Booking Confirmed - {{propertyName}}",
  "bodyTemplate": "Hi {{guestName}},\n\nYour booking has been confirmed!\n\nProperty: {{propertyName}}\nCheck-in: {{checkInDate}} at {{checkInTime}}\nCheck-out: {{checkOutDate}} at {{checkOutTime}}\nTotal: {{totalAmount}}\n\nBooking Reference: {{bookingReference}}\n\nWe look forward to hosting you!\n\nBest regards,\nProperty Management Team",
  "applyToRentalType": "SHORT_TERM",
  "isActive": true
}
```

#### 2. Booking is Created

When a guest creates a booking via the booking API:

1. Booking record is inserted into the database
2. `messageSchedulerService.scheduleForBooking()` is called
3. System finds all active automations with `triggerType = BOOKING_CREATED`
4. For each matching automation:
   - Filters by rental type and property
   - Calculates send time (now + offset)
   - Renders template with booking data
   - Creates `ScheduledMessage` with `status = PENDING`

#### 3. Cron Job Processes the Message

Within 15 minutes, the cron job runs:

1. Finds all pending messages with `scheduledFor <= now`
2. For each message:
   - Updates status to `SENDING`
   - Sends email via SMTP
   - Updates status to `SENT` (or `FAILED`)
   - Increments `totalSent` counter on automation

#### 4. Guest Receives Email

```
Subject: Booking Confirmed - Ocean View Apartment

Hi John Smith,

Your booking has been confirmed!

Property: Ocean View Apartment
Check-in: January 15, 2025 at 15:00
Check-out: January 20, 2025 at 11:00
Total: $750.00

Booking Reference: BK-2025-001234

We look forward to hosting you!

Best regards,
Property Management Team
```

---

## File Locations Reference

### Database Schema

| File                   | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `prisma/schema.prisma` | MessageAutomation, ScheduledMessage models, enums |

### Services

| File                                                           | Description                  |
| -------------------------------------------------------------- | ---------------------------- |
| `lib/features/messaging/services/automation.service.ts`        | Automation CRUD operations   |
| `lib/features/messaging/services/message-scheduler.service.ts` | Core scheduling & processing |
| `lib/features/messaging/services/template-engine.service.ts`   | Template rendering           |

### Repositories

| File                                                                  | Description             |
| --------------------------------------------------------------------- | ----------------------- |
| `lib/features/messaging/repositories/automation.repository.ts`        | Automation database ops |
| `lib/features/messaging/repositories/scheduled-message.repository.ts` | Message database ops    |

### Utilities

| File                                                | Description               |
| --------------------------------------------------- | ------------------------- |
| `lib/features/messaging/utils/delivery-provider.ts` | Channel-specific delivery |

### DTOs (Validation)

| File                                                   | Description                |
| ------------------------------------------------------ | -------------------------- |
| `lib/features/messaging/dtos/automation.dto.ts`        | Input validation schemas   |
| `lib/features/messaging/dtos/scheduled-message.dto.ts` | Message validation schemas |

### API Routes

| Path                                                 | Description                  |
| ---------------------------------------------------- | ---------------------------- |
| `app/api/messaging/automations/route.ts`             | List/Create automations      |
| `app/api/messaging/automations/[id]/route.ts`        | Get/Update/Delete automation |
| `app/api/messaging/automations/[id]/test/route.ts`   | Test automation              |
| `app/api/messaging/automations/[id]/toggle/route.ts` | Toggle active status         |
| `app/api/messaging/scheduled/route.ts`               | List scheduled messages      |
| `app/api/messaging/scheduled/[id]/route.ts`          | Get/Cancel scheduled message |
| `app/api/messaging/scheduled/process/route.ts`       | Cron job endpoint            |

### UI Components

| File                                             | Description                 |
| ------------------------------------------------ | --------------------------- |
| `components/messaging/automation-form.tsx`       | Create/Edit automation form |
| `components/messaging/automation-card.tsx`       | Automation display card     |
| `components/messaging/test-automation-modal.tsx` | Test automation modal       |
| `components/messaging/variable-suggestions.tsx`  | Template variable picker    |

### Configuration

| File          | Description       |
| ------------- | ----------------- |
| `vercel.json` | Cron job schedule |

---

## Current Limitations

| Feature                 | Status      | Notes                                  |
| ----------------------- | ----------- | -------------------------------------- |
| Email                   | Implemented | Gmail SMTP                             |
| SMS                     | Planned     | Twilio integration stub exists         |
| WhatsApp                | Planned     | WhatsApp Business API stub exists      |
| In-App Notifications    | Partial     | Model exists, not fully integrated     |
| AI Enhancement          | Partial     | UI exists, processing not implemented  |
| Email Tracking          | Planned     | Open/click tracking not implemented    |
| Tenant Automations      | Partial     | Payment triggers partially implemented |
| Maintenance Automations | Planned     | Triggers defined, integration pending  |

---

## Environment Variables

```bash
# Email (Required)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Cron Job Authentication (Required for production)
CRON_SECRET=your_secure_random_string

# SMS - Twilio (Future)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```
