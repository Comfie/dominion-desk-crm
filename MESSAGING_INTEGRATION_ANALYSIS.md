# Messaging System Integration Analysis

## Executive Summary

The Property Management CRM currently has **TWO separate messaging systems** that need to be integrated:

1. **Legacy Manual Messaging System** (Existing)
   - Location: `app/api/messages/`, `app/(dashboard)/messages/`
   - Purpose: Manual one-off message composition and sending
   - Features: Email templates, manual recipient selection, message history

2. **New Automated Messaging & Automation System** (Just Implemented)
   - Location: `lib/features/messaging/`, `app/api/messaging/`
   - Purpose: Automated event-driven message scheduling and delivery
   - Features: Automation rules, template engine, scheduled queue, multi-channel delivery

## Current State Analysis

### Legacy System Components

#### Database Models

- **Message** - Core message record model (existing in schema)
  - Fields: subject, message, messageType, direction, recipientEmail, recipientPhone, status
  - Relations: User, Booking, Tenant
  - Tracking: sentAt, deliveredAt, readAt
  - Thread support: threadId, replyTo

- **MessageTemplate** - Predefined email templates (existing in schema)
  - Static template definitions
  - No variable replacement engine
  - Category-based organization

#### API Endpoints

- `GET /api/messages` - List all messages with filtering
- `POST /api/messages` - Create message record
- `POST /api/messages/send` - Send email via nodemailer
- `GET /api/messages/[id]` - Get single message

#### Services

- `lib/email.ts` - Nodemailer integration with hardcoded templates
  - Email templates: bookingConfirmation, checkInReminder, paymentReminder, maintenanceUpdate, generic
  - Direct SMTP sending via nodemailer
  - No abstraction for other channels (SMS, WhatsApp)

#### UI Pages

- `/messages` - Message inbox with filters and summary stats
- `/messages/new` - Manual message composition form
- `/messages/[id]` - Message detail view
- `/messages/templates/` - Template management (basic)

### New Automation System Components

#### Database Models

- **MessageAutomation** - Automation rule definitions
  - Trigger-based (14 different triggers)
  - Time offset and scheduling logic
  - Property and rental type filtering
  - Analytics tracking (totalSent, totalOpened, totalClicked)

- **ScheduledMessage** - Queued messages awaiting delivery
  - Status workflow: PENDING → SENDING → SENT/FAILED
  - Tracks scheduledFor time
  - Links to automation that created it

- **MessageThread** - Conversation grouping
  - Participant tracking
  - Last message timestamp
  - Context linking (booking, tenant, property)

- **CannedResponse** - Quick reply templates
  - Category-based organization
  - Variable support

#### API Endpoints

- `GET/POST /api/messaging/automations` - CRUD for automation rules
- `GET/PUT/DELETE /api/messaging/automations/[id]` - Individual automation management
- `POST /api/messaging/automations/[id]/toggle` - Enable/disable automation
- `POST /api/messaging/automations/[id]/test` - Test automation with real data
- `GET /api/messaging/scheduled` - List scheduled messages
- `GET/DELETE /api/messaging/scheduled/[id]` - Manage scheduled messages
- `POST /api/messaging/scheduled/process` - Cron job processor
- Thread and canned response endpoints

#### Services

- `TemplateEngineService` - {{variable}} replacement engine
  - Supports nested variables like `{{property.name}}`
  - Context-aware rendering
  - Variable extraction and validation

- `MessageSchedulerService` - Queue processing and scheduling
  - `scheduleForBooking()` - Creates scheduled messages from automation rules
  - `processPending()` - Cron job execution logic
  - Time calculation with offset and time-of-day support

- `AutomationService` - Business logic for automation management
  - Property validation
  - Test message sending
  - Analytics tracking

- `DeliveryProviderService` - Multi-channel abstraction
  - Email, SMS, WhatsApp support (stubs for SMS/WhatsApp)
  - Unified send interface

#### Repositories

- AutomationRepository, ScheduledMessageRepository, ThreadRepository, CannedResponseRepository
- Full CRUD with multi-tenancy scoping
- Analytics increment helpers

## Integration Challenges

### 1. **Duplicate Message Sending Logic**

- **Problem**: Legacy system uses `lib/email.ts` with nodemailer directly, new system uses `DeliveryProviderService`
- **Impact**: No unified interface for message delivery
- **Risk**: Email sent via legacy route won't be tracked by automation analytics

### 2. **Incompatible Template Systems**

- **Problem**: Legacy uses hardcoded functions in `emailTemplates`, new system uses `TemplateEngineService` with `{{variable}}` syntax
- **Impact**: Cannot reuse templates between systems
- **Example**:
  - Legacy: `emailTemplates.bookingConfirmation({ guestName: "John" })`
  - New: `templateEngineService.render("Hello {{guestName}}", { guestName: "John" })`

### 3. **Message Model Gap**

- **Problem**: New automation system creates `ScheduledMessage` records, but doesn't automatically create `Message` records after sending
- **Impact**: Automated messages won't appear in the legacy inbox UI (`/messages`)
- **User Experience**: Users can't see full message history in one place

### 4. **No Thread Support in Legacy UI**

- **Problem**: New system has `MessageThread` model, legacy UI doesn't support conversation threading
- **Impact**: Cannot view message conversations in inbox

### 5. **Authentication Pattern Mismatch**

- **Problem**: Legacy uses `getServerSession(authOptions)`, new system uses `requireAuth()`
- **Impact**: Inconsistent auth handling across codebase
- **Severity**: Low (both work, but creates maintenance debt)

### 6. **Missing Multi-Tenancy in Legacy**

- **Problem**: Legacy system uses `session.user.id` directly, new system uses `session.user.organizationId`
- **Impact**: Team members won't see messages sent by organization owner
- **Severity**: **CRITICAL** - Breaks multi-tenancy model

## Recommended Integration Strategy

### Phase 1: Immediate Fixes (Critical Path)

#### 1.1 Fix Multi-Tenancy in Legacy System

**File**: `app/api/messages/route.ts`

```typescript
// BEFORE (Line 28)
const where = {
  userId: session.user.id,
  // ...
};

// AFTER
const where = {
  userId: session.user.organizationId, // Use organizationId for proper multi-tenancy
  // ...
};
```

**Impact**: Ensures team members see all organization messages

#### 1.2 Update Legacy to Use `requireAuth()`

**Files**: `app/api/messages/*.ts`

```typescript
// BEFORE
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const session = await getServerSession(authOptions);
if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// AFTER
import { requireAuth } from '@/lib/auth-helpers';
const session = await requireAuth(); // Throws if unauthorized
```

**Impact**: Consistent auth pattern, auto-throws on unauthorized

#### 1.3 Add Audit Logging to Legacy Send Endpoint

**File**: `app/api/messages/send/route.ts`

```typescript
import { logAudit } from '@/lib/shared/audit';

// After creating message (line 106+)
await logAudit(session, 'created', 'message', message.id, undefined, request);
```

**Impact**: All messages tracked in audit log

### Phase 2: Unified Message History

#### 2.1 Create Message Record After Automation Sends

**File**: `lib/features/messaging/services/message-scheduler.service.ts`
**Location**: `processPending()` method after successful send (line 111)

```typescript
// After successfully sending and updating to SENT
await scheduledMessageRepository.updateStatus(message.id, ScheduledMessageStatus.SENT);

// ADD: Create Message record for unified inbox
await prisma.message.create({
  data: {
    userId: message.userId,
    bookingId: message.bookingId,
    tenantId: message.tenantId,
    subject: message.subject || undefined,
    message: message.body,
    messageType: message.messageType,
    direction: 'OUTBOUND',
    recipientEmail: message.recipientEmail || undefined,
    recipientPhone: message.recipientPhone || undefined,
    status: 'SENT',
    sentAt: new Date(),
    threadId: message.threadId || undefined,
  },
});
```

**Impact**: All automated messages appear in `/messages` inbox

#### 2.2 Link ScheduledMessage to Message Model

**File**: `prisma/schema.prisma`

```prisma
model ScheduledMessage {
  // ... existing fields
  sentMessageId String?  // NEW: Reference to Message after sent
  sentMessage   Message? @relation(fields: [sentMessageId], references: [id], onDelete: SetNull)
}

model Message {
  // ... existing fields
  scheduledMessage ScheduledMessage? // NEW: Reverse relation
}
```

**Migration Required**: Yes
**Impact**: Can track which Message came from which ScheduledMessage

### Phase 3: Unified Delivery Provider

#### 3.1 Migrate Legacy Email Sending to DeliveryProviderService

**File**: `app/api/messages/send/route.ts` (line 97-103)

```typescript
// BEFORE
import { sendEmail, emailTemplates } from '@/lib/email';
const emailResult = await sendEmail({
  to: data.recipientEmail,
  subject: emailContent.subject,
  html: emailContent.html,
  text: emailContent.text,
  replyTo: data.replyTo,
});

// AFTER
import { deliveryProviderService } from '@/lib/features/messaging';
await deliveryProviderService.send({
  type: 'EMAIL',
  recipient: data.recipientEmail,
  subject: emailContent.subject,
  body: emailContent.html, // or text version
});
```

**Impact**: All emails go through same delivery layer

#### 3.2 Enhance DeliveryProviderService to Support HTML

**File**: `lib/features/messaging/utils/delivery-provider.ts`

```typescript
export interface DeliveryMessage {
  type: MessageType;
  recipient: string;
  subject?: string;
  body: string;
  bodyHtml?: string; // NEW: Support HTML emails
  replyTo?: string; // NEW: Support reply-to
  attachments?: any; // NEW: Support attachments
}
```

### Phase 4: Unified Template System

#### 4.1 Convert Legacy Templates to New Format

**Create**: `lib/features/messaging/templates/predefined-templates.ts`

```typescript
export const predefinedTemplates = {
  bookingConfirmation: {
    name: 'Booking Confirmation',
    subject: 'Booking Confirmation - {{propertyName}}',
    bodyTemplate: `
Dear {{guestName}},

Thank you for your booking! Here are your reservation details:

Property: {{propertyName}}
{{#if propertyAddress}}Address: {{propertyAddress}}{{/if}}
Check-in: {{checkInDate}} at {{checkInTime}}
Check-out: {{checkOutDate}} at {{checkOutTime}}
Total Amount: {{totalAmount}}

If you have any questions, please don't hesitate to contact us.

Best regards,
Property Management Team
    `.trim(),
    messageType: 'EMAIL' as const,
    category: 'booking',
  },
  // ... other templates
};
```

#### 4.2 Migrate MessageTemplate Model to Use New Engine

**Migration Path**:

1. Add `bodyTemplate` field to existing MessageTemplate records
2. Convert hardcoded templates to `{{variable}}` format
3. Update template management UI to use new syntax

### Phase 5: Frontend Integration

#### 5.1 Create Unified Messages Dashboard

**New Page**: `app/(dashboard)/messages/all/page.tsx`

- Combine manual messages + automated messages
- Single timeline view
- Filter by source (manual vs automated)

#### 5.2 Add Automation Tab to Messages Section

**Update**: `app/(dashboard)/messages/layout.tsx`

```tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="inbox">Inbox</TabsTrigger>
    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
    <TabsTrigger value="automations">Automations</TabsTrigger>
    <TabsTrigger value="templates">Templates</TabsTrigger>
  </TabsList>
</Tabs>
```

#### 5.3 Show Automation Info in Message Cards

**Update**: `components/messages/message-card.tsx`

```tsx
{
  message.automation && (
    <Badge variant="secondary">
      <Zap className="mr-1 h-3 w-3" />
      Automated
    </Badge>
  );
}
```

## Migration Checklist

### Immediate (Before Next Deployment)

- [ ] Fix multi-tenancy in legacy `/api/messages` endpoints (organizationId)
- [ ] Update legacy auth to use `requireAuth()`
- [ ] Add audit logging to legacy send endpoint
- [ ] Test that team members can see organization messages

### Short Term (This Sprint)

- [ ] Create Message records when ScheduledMessage is sent
- [ ] Add `sentMessageId` relation between ScheduledMessage and Message
- [ ] Update DeliveryProviderService to support HTML and attachments
- [ ] Migrate legacy send endpoint to use DeliveryProviderService

### Medium Term (Next Sprint)

- [ ] Convert legacy email templates to `{{variable}}` format
- [ ] Create predefined templates file
- [ ] Update template UI to support new syntax
- [ ] Add template preview with variable replacement

### Long Term (Future)

- [ ] Build unified inbox UI combining manual + automated
- [ ] Add automation management to `/messages` section
- [ ] Implement thread view for conversations
- [ ] Add analytics dashboard for automation performance

## Architecture Recommendation

### Proposed Unified Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend UI Layer                       │
│  /messages (Inbox) | /messages/automations | /scheduled  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    API Layer                             │
│  /api/messaging/* (New, standardized endpoints)          │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  Service Layer                           │
│  MessageService (unified) | AutomationService | etc.     │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                 Repository Layer                         │
│  MessageRepository | AutomationRepository | etc.         │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│              Shared Services Layer                       │
│  DeliveryProviderService (Email/SMS/WhatsApp)            │
│  TemplateEngineService (Variable replacement)            │
│  SchedulerService (Queue processing)                     │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  Database Layer                          │
│  Message | MessageAutomation | ScheduledMessage | etc.   │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Single Source of Truth**: All messages stored in `Message` table
2. **Unified Delivery**: All channels go through `DeliveryProviderService`
3. **Template Engine**: All templates use `TemplateEngineService` with `{{variable}}` syntax
4. **Audit Everything**: All message operations logged via `logAudit()`
5. **Multi-Tenancy First**: All queries scoped to `organizationId`

## Risk Assessment

### High Risk Issues

1. **Multi-tenancy bug in legacy system** - Team members can't see messages (CRITICAL)
2. **Split message history** - Users confused by missing automated messages in inbox

### Medium Risk Issues

1. **Duplicate delivery logic** - Maintenance burden, potential bugs
2. **Template migration complexity** - Data migration required

### Low Risk Issues

1. **Auth pattern inconsistency** - No functional impact, just tech debt
2. **Missing thread UI** - New feature, not a regression

## Success Metrics

### Integration Complete When:

- [ ] All messages (manual + automated) appear in `/messages` inbox
- [ ] Team members see full organization message history
- [ ] All delivery goes through DeliveryProviderService
- [ ] All templates use TemplateEngineService
- [ ] Audit logs capture all message operations
- [ ] Zero duplicate code between legacy and new systems
- [ ] Type checks pass
- [ ] All existing tests pass

## Next Steps

1. **Review this analysis** with stakeholders
2. **Prioritize migration phases** based on business needs
3. **Create tickets** for each checklist item
4. **Implement Phase 1 fixes** immediately (critical multi-tenancy bug)
5. **Plan Phase 2 sprint** for unified message history
6. **Schedule Phase 3-5** based on roadmap priorities

---

**Document Version**: 1.0
**Date**: December 2, 2025
**Author**: Senior Full-Stack Engineer
**Status**: Ready for Review
