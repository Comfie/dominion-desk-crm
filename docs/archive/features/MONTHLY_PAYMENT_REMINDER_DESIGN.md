# Monthly Rental Payment Reminder System - Design Document

## 📋 Overview

Design for automated monthly rental payment reminders sent to tenants, including invoice generation with banking details, payment breakdown, and due date information.

**Date**: December 2, 2025
**Status**: Design Phase
**Implementation Time**: ~4-6 hours

---

## 🎯 Requirements

### Functional Requirements

1. Send automated payment reminders to all active tenants monthly
2. Generate PDF invoice for each tenant with:
   - Rental amount breakdown
   - Banking details for payment
   - Property details
   - Tenant information
   - Payment due date
   - Late fee information (if applicable)
3. Support multiple payment schedules:
   - Monthly (1st of month)
   - Custom dates (5th, 15th, etc.)
4. Track payment status to avoid duplicate reminders
5. Handle timezone-aware scheduling
6. Support customizable reminder timing (e.g., 5 days before due date)

### Non-Functional Requirements

- Scalable (handle 1000+ tenants)
- Reliable (must not miss any tenant)
- Audit trail (track all reminders sent)
- Error handling (failed sends retry)
- Performance (generate invoices efficiently)

---

## 🏗️ Architecture Design

### Option 1: Automation-Based (Recommended)

**Use existing automation system** with enhancements:

#### Pros:

- Leverages existing infrastructure
- Consistent with booking automation
- UI already planned for automation management
- Analytics built-in
- Scalable queue system

#### Cons:

- Need to add tenant-based automation support
- Need monthly recurring trigger

#### Implementation:

```typescript
// New trigger type
enum AutomationTrigger {
  // ... existing triggers
  RENT_DUE_REMINDER,           // X days before rent due
  RENT_OVERDUE,                // After rent due date
  MONTHLY_STATEMENT,           // Monthly invoice/statement
}

// New scheduling logic
- Check all active leases
- For each lease, check paymentDueDay (e.g., 1st of month)
- Schedule reminder X days before (e.g., 3 days)
- Generate invoice on-demand when sending
```

### Option 2: Dedicated Payment Reminder Service

**Create separate payment reminder system**:

#### Pros:

- Isolated from automation system
- Can optimize specifically for recurring payments
- Simpler billing logic

#### Cons:

- Duplicate infrastructure
- No reuse of automation UI
- Separate cron jobs needed
- More maintenance overhead

**Decision**: Go with **Option 1** (Automation-Based) for consistency and leverage existing system.

---

## 📊 Database Schema Updates

### Update Tenant Model (if not exists)

```prisma
model Tenant {
  // ... existing fields

  // Payment Configuration
  monthlyRent         Decimal?
  paymentDueDay       Int?      @default(1)  // Day of month (1-28)
  paymentMethod       String?   // Bank transfer, cash, etc.
  lastPaymentDate     DateTime?
  nextPaymentDue      DateTime?

  // Payment Reminder Settings
  reminderDaysBefore  Int?      @default(3)   // Days before due date
  autoSendReminder    Boolean   @default(true)

  // Banking Details (for invoice)
  preferredPaymentMethod  String?  // "bank_transfer", "cash", "check"
}
```

### Add Payment Model (if not exists)

```prisma
model Payment {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Relationship
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  propertyId      String?
  property        Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)

  // Payment Details
  amount          Decimal
  paymentType     PaymentType    @default(RENT)
  paymentMethod   PaymentMethod?

  // Status
  status          PaymentStatus  @default(PENDING)
  dueDate         DateTime
  paidDate        DateTime?

  // Invoice
  invoiceNumber   String?   @unique
  invoiceUrl      String?   // PDF URL

  // Tracking
  reminderSent    Boolean   @default(false)
  reminderSentAt  DateTime?

  // Metadata
  description     String?
  notes           String?   @db.Text

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId, tenantId])
  @@index([dueDate, status])
}

enum PaymentType {
  RENT
  DEPOSIT
  UTILITY
  LATE_FEE
  MAINTENANCE
  OTHER
}

enum PaymentMethod {
  BANK_TRANSFER
  CASH
  CHECK
  CREDIT_CARD
  PAYPAL
  OTHER
}

enum PaymentStatus {
  PENDING
  PAID
  OVERDUE
  PARTIAL
  CANCELLED
}
```

### Add Organization Banking Details

```prisma
model User {
  // ... existing fields

  // Banking Details for Invoices
  bankName            String?
  bankAccountName     String?
  bankAccountNumber   String?
  bankRoutingNumber   String?
  bankSwiftCode       String?
  paymentInstructions String? @db.Text
}
```

---

## 🔄 Implementation Plan

### Phase 1: Database & Core Logic (2 hours)

#### 1.1 Update Database Schema

```bash
# Add new fields to Tenant model
# Add Payment model
# Add banking fields to User model
npx prisma migrate dev --name add_payment_system
```

#### 1.2 Create Payment Repository

```typescript
// lib/features/payments/repositories/payment.repository.ts
export class PaymentRepository {
  async findDuePayments(userId: string, dueDate: Date) {
    return prisma.payment.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          gte: new Date(dueDate.setHours(0, 0, 0, 0)),
          lte: new Date(dueDate.setHours(23, 59, 59, 999)),
        },
        reminderSent: false,
      },
      include: {
        tenant: true,
        property: true,
      },
    });
  }

  async generateMonthlyPayments(userId: string, forMonth: Date) {
    // Find all active tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        monthlyRent: { not: null },
      },
    });

    // Create payment records for the month
    const payments = tenants.map((tenant) => ({
      userId,
      tenantId: tenant.id,
      propertyId: tenant.propertyId,
      amount: tenant.monthlyRent!,
      paymentType: 'RENT' as const,
      status: 'PENDING' as const,
      dueDate: new Date(forMonth.getFullYear(), forMonth.getMonth(), tenant.paymentDueDay || 1),
      description: `Rent for ${forMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      invoiceNumber: `INV-${Date.now()}-${tenant.id.slice(0, 8)}`,
    }));

    return prisma.payment.createMany({
      data: payments,
      skipDuplicates: true, // Prevent duplicate payments
    });
  }

  async markReminderSent(paymentId: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        reminderSent: true,
        reminderSentAt: new Date(),
      },
    });
  }
}
```

### Phase 2: Invoice Generation (2 hours)

#### 2.1 Install PDF Generation Library

```bash
npm install pdfkit
npm install @types/pdfkit --save-dev
```

#### 2.2 Create Invoice Service

```typescript
// lib/features/payments/services/invoice.service.ts
import PDFDocument from 'pdfkit';
import { writeFile } from 'fs/promises';
import path from 'path';

export class InvoiceService {
  async generateInvoice(payment: Payment & { tenant: Tenant; property?: Property; user: User }) {
    return new Promise<string>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `invoice-${payment.invoiceNumber}.pdf`;
      const filePath = path.join(process.cwd(), 'public', 'invoices', fileName);

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('RENTAL INVOICE', { align: 'center' });
      doc.moveDown();

      // Organization Details
      doc.fontSize(12).text('FROM:', { underline: true });
      doc
        .fontSize(10)
        .text(payment.user.firstName + ' ' + payment.user.lastName)
        .text(payment.user.email)
        .text(payment.user.phone || '');
      doc.moveDown();

      // Tenant Details
      doc.fontSize(12).text('TO:', { underline: true });
      doc
        .fontSize(10)
        .text(payment.tenant.firstName + ' ' + payment.tenant.lastName)
        .text(payment.tenant.email)
        .text(payment.tenant.phone || '');
      doc.moveDown();

      // Invoice Details
      doc.fontSize(12).text('INVOICE DETAILS', { underline: true });
      doc
        .fontSize(10)
        .text(`Invoice Number: ${payment.invoiceNumber}`)
        .text(`Invoice Date: ${new Date().toLocaleDateString()}`)
        .text(`Due Date: ${payment.dueDate.toLocaleDateString()}`)
        .text(`Property: ${payment.property?.name || 'N/A'}`)
        .text(`Address: ${payment.property?.address || 'N/A'}`);
      doc.moveDown();

      // Payment Table
      doc.fontSize(12).text('PAYMENT BREAKDOWN', { underline: true });

      const tableTop = doc.y + 10;
      doc.fontSize(10);

      // Table Headers
      doc.text('Description', 50, tableTop, { width: 250 });
      doc.text('Amount', 350, tableTop, { width: 100, align: 'right' });

      // Line
      doc
        .moveTo(50, tableTop + 20)
        .lineTo(450, tableTop + 20)
        .stroke();

      // Monthly Rent
      const itemY = tableTop + 30;
      doc.text(payment.description || 'Monthly Rent', 50, itemY, { width: 250 });
      doc.text(`$${payment.amount.toString()}`, 350, itemY, { width: 100, align: 'right' });

      // Total Line
      doc
        .moveTo(50, itemY + 30)
        .lineTo(450, itemY + 30)
        .stroke();

      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL DUE', 50, itemY + 40, { width: 250 });
      doc.text(`$${payment.amount.toString()}`, 350, itemY + 40, { width: 100, align: 'right' });
      doc.font('Helvetica');

      doc.moveDown(4);

      // Banking Details
      doc.fontSize(12).text('PAYMENT INSTRUCTIONS', { underline: true });
      doc.fontSize(10);

      if (payment.user.bankName) {
        doc.text(`Bank Name: ${payment.user.bankName}`);
        doc.text(`Account Name: ${payment.user.bankAccountName || 'N/A'}`);
        doc.text(`Account Number: ${payment.user.bankAccountNumber || 'N/A'}`);
        if (payment.user.bankRoutingNumber) {
          doc.text(`Routing Number: ${payment.user.bankRoutingNumber}`);
        }
        if (payment.user.bankSwiftCode) {
          doc.text(`SWIFT Code: ${payment.user.bankSwiftCode}`);
        }
      }

      if (payment.user.paymentInstructions) {
        doc.moveDown();
        doc.text('Additional Instructions:');
        doc.fontSize(9).text(payment.user.paymentInstructions);
      }

      // Footer
      doc.moveDown(2);
      doc
        .fontSize(8)
        .text('Please include your invoice number in the payment reference.', { align: 'center' })
        .text('For questions, contact us at ' + payment.user.email, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(`/invoices/${fileName}`);
      });

      stream.on('error', reject);
    });
  }
}
```

#### 2.3 Alternative: HTML Invoice (Simpler)

```typescript
// lib/features/payments/templates/invoice-html.ts
export function generateInvoiceHTML(
  payment: Payment & { tenant: Tenant; property?: Property; user: User }
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; }
    .total { font-size: 18px; font-weight: bold; }
    .banking { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RENTAL INVOICE</h1>
    <p>Invoice #${payment.invoiceNumber}</p>
  </div>

  <div class="section">
    <div class="section-title">FROM</div>
    <p><strong>${payment.user.firstName} ${payment.user.lastName}</strong></p>
    <p>${payment.user.email}</p>
    <p>${payment.user.phone || ''}</p>
  </div>

  <div class="section">
    <div class="section-title">BILL TO</div>
    <p><strong>${payment.tenant.firstName} ${payment.tenant.lastName}</strong></p>
    <p>${payment.tenant.email}</p>
    <p>${payment.tenant.phone || ''}</p>
  </div>

  <div class="section">
    <div class="section-title">INVOICE DETAILS</div>
    <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Due Date:</strong> ${payment.dueDate.toLocaleDateString()}</p>
    <p><strong>Property:</strong> ${payment.property?.name || 'N/A'}</p>
    <p><strong>Address:</strong> ${payment.property?.address || 'N/A'}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${payment.description || 'Monthly Rent'}</td>
        <td style="text-align: right;">$${payment.amount.toString()}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total">
        <td>TOTAL DUE</td>
        <td style="text-align: right;">$${payment.amount.toString()}</td>
      </tr>
    </tfoot>
  </table>

  <div class="section banking">
    <div class="section-title">PAYMENT INSTRUCTIONS</div>
    <p><strong>Bank Name:</strong> ${payment.user.bankName || 'N/A'}</p>
    <p><strong>Account Name:</strong> ${payment.user.bankAccountName || 'N/A'}</p>
    <p><strong>Account Number:</strong> ${payment.user.bankAccountNumber || 'N/A'}</p>
    ${payment.user.bankRoutingNumber ? `<p><strong>Routing Number:</strong> ${payment.user.bankRoutingNumber}</p>` : ''}
    ${payment.user.bankSwiftCode ? `<p><strong>SWIFT Code:</strong> ${payment.user.bankSwiftCode}</p>` : ''}
    ${payment.user.paymentInstructions ? `<p style="margin-top: 10px;"><em>${payment.user.paymentInstructions}</em></p>` : ''}
  </div>

  <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
    <p>Please include invoice number <strong>${payment.invoiceNumber}</strong> in payment reference</p>
    <p>For questions, contact ${payment.user.email}</p>
  </div>
</body>
</html>
  `;
}

// Convert HTML to PDF using puppeteer
import puppeteer from 'puppeteer';

export async function generatePDFFromHTML(html: string, outputPath: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({ path: outputPath, format: 'A4' });
  await browser.close();
}
```

### Phase 3: Monthly Payment Reminder Cron (1 hour)

#### 3.1 Create Monthly Payment Generation Cron

```typescript
// app/api/payments/generate-monthly/route.ts
import { NextResponse } from 'next/server';
import { paymentRepository } from '@/lib/features/payments';

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all organizations
    const organizations = await prisma.user.findMany({
      where: {
        organizationId: null, // Only organization owners
      },
    });

    let totalGenerated = 0;

    // For each organization, generate next month's payments
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    for (const org of organizations) {
      const result = await paymentRepository.generateMonthlyPayments(org.id, nextMonth);
      totalGenerated += result.count;
    }

    return NextResponse.json({
      success: true,
      totalGenerated,
      month: nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
  } catch (error) {
    console.error('Failed to generate monthly payments:', error);
    return NextResponse.json({ error: 'Failed to generate payments' }, { status: 500 });
  }
}
```

#### 3.2 Create Payment Reminder Sender Cron

```typescript
// app/api/payments/send-reminders/route.ts
import { NextResponse } from 'next/server';
import { paymentRepository } from '@/lib/features/payments';
import { invoiceService } from '@/lib/features/payments/services/invoice.service';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find payments due in next 3 days that haven't had reminder sent
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 3);

    const users = await prisma.user.findMany({
      where: { organizationId: null },
    });

    let totalSent = 0;

    for (const user of users) {
      const duePayments = await paymentRepository.findDuePayments(user.id, reminderDate);

      for (const payment of duePayments) {
        // Generate invoice
        const invoiceUrl = await invoiceService.generateInvoice(payment);

        // Update payment with invoice URL
        await prisma.payment.update({
          where: { id: payment.id },
          data: { invoiceUrl },
        });

        // Send email with invoice
        await sendEmail({
          to: payment.tenant.email,
          subject: `Rent Payment Reminder - Due ${payment.dueDate.toLocaleDateString()}`,
          html: `
            <h2>Rent Payment Reminder</h2>
            <p>Dear ${payment.tenant.firstName},</p>
            <p>This is a friendly reminder that your rent payment of <strong>$${payment.amount}</strong> is due on <strong>${payment.dueDate.toLocaleDateString()}</strong>.</p>
            <p><strong>Property:</strong> ${payment.property?.name || 'N/A'}</p>
            <p>Please find your invoice attached with payment instructions.</p>
            <p>If you have already made this payment, please disregard this reminder.</p>
            <p>Thank you!</p>
          `,
          attachments: [
            {
              filename: `invoice-${payment.invoiceNumber}.pdf`,
              path: invoiceUrl,
            },
          ],
        });

        // Mark reminder as sent
        await paymentRepository.markReminderSent(payment.id);
        totalSent++;
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: totalSent,
    });
  } catch (error) {
    console.error('Failed to send payment reminders:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
```

#### 3.3 Update vercel.json

```json
{
  "crons": [
    {
      "path": "/api/messaging/scheduled/process",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/payments/generate-monthly",
      "schedule": "0 0 25 * *"
    },
    {
      "path": "/api/payments/send-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedules**:

- Message processing: Every 10 minutes
- Generate monthly payments: 25th of each month at midnight (for next month)
- Send payment reminders: Daily at 9 AM (sends to tenants with payments due in 3 days)

---

## 🎨 Alternative: Use Automation System

### Simpler Approach Using Existing Infrastructure

Instead of custom cron jobs, extend the automation system:

#### 1. Add RENT_DUE_REMINDER Trigger

```typescript
// Already exists in AutomationTrigger enum - just use it!
await messageSchedulerService.scheduleForTenant(
  tenantId,
  organizationId,
  AutomationTrigger.PAYMENT_REMINDER
);
```

#### 2. Create Tenant-Based Scheduler

```typescript
// lib/features/messaging/services/message-scheduler.service.ts
export class MessageSchedulerService {
  // ... existing methods

  async scheduleForTenant(tenantId: string, userId: string, trigger: AutomationTrigger) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { property: true },
    });

    if (!tenant) return;

    const automations = await automationRepository.findActive(userId, trigger);

    for (const automation of automations) {
      // Calculate scheduled time based on payment due date
      const scheduledFor = this.calculatePaymentReminderTime(tenant, automation.triggerOffset);

      const context = {
        tenantName: `${tenant.firstName} ${tenant.lastName}`,
        tenantEmail: tenant.email,
        propertyName: tenant.property?.name,
        propertyAddress: tenant.property?.address,
        rentAmount: tenant.monthlyRent?.toString(),
        dueDate: tenant.nextPaymentDue?.toLocaleDateString(),
        // Add banking details from user
      };

      const renderedBody = templateEngineService.render(automation.bodyTemplate, context);

      await scheduledMessageRepository.create(userId, {
        automationId: automation.id,
        tenantId: tenant.id,
        recipientEmail: tenant.email,
        recipientName: `${tenant.firstName} ${tenant.lastName}`,
        messageType: automation.messageType,
        subject: automation.subject
          ? templateEngineService.render(automation.subject, context)
          : '',
        body: renderedBody,
        scheduledFor,
      });
    }
  }

  private calculatePaymentReminderTime(tenant: Tenant, offset?: number): Date {
    // Get next payment due date
    const dueDate = tenant.nextPaymentDue || new Date();

    // Send reminder X days before (default 3 days)
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - (offset || 3));

    // Set to 9 AM
    reminderDate.setHours(9, 0, 0, 0);

    return reminderDate;
  }
}
```

#### 3. Monthly Cron to Schedule Reminders

```typescript
// app/api/tenants/schedule-payment-reminders/route.ts
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find all active tenants with upcoming payments
  const tenants = await prisma.tenant.findMany({
    where: {
      status: 'ACTIVE',
      monthlyRent: { not: null },
      autoSendReminder: true,
    },
  });

  let scheduled = 0;

  for (const tenant of tenants) {
    try {
      await messageSchedulerService.scheduleForTenant(
        tenant.id,
        tenant.userId,
        AutomationTrigger.PAYMENT_REMINDER
      );
      scheduled++;
    } catch (error) {
      console.error(`Failed to schedule for tenant ${tenant.id}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    tenantsScheduled: scheduled,
  });
}
```

---

## 📝 Recommendation

I recommend a **hybrid approach**:

1. **Use Automation System** for sending reminder emails
2. **Add Invoice Generation** as attachment to email
3. **Create Payment Records** for tracking
4. **Monthly Cron** to generate payment records and schedule automations

### Why This Works Best:

✅ Leverages existing automation infrastructure
✅ Reuses template engine and delivery system
✅ Invoice generation is modular (can be attached to any email)
✅ Payment tracking separate from messaging
✅ Scalable and maintainable
✅ UI already planned for automation management

---

## 🚀 Quick Start Implementation

### Fastest Path (2-3 hours):

1. **Create Payment model** (30 min)
2. **Add invoice HTML template** (30 min)
3. **Create payment reminder cron** (1 hour)
4. **Test with sample tenant** (30 min)

### Full Implementation (4-6 hours):

1. Database schema updates
2. Payment repository and service
3. Invoice generation (PDF or HTML)
4. Monthly cron jobs
5. Integration with automation system
6. Testing and debugging

---

## 📋 Next Steps

Would you like me to:

1. **Implement the Quick Start** (HTML invoice + basic cron)?
2. **Implement Full Solution** (PDF generation + payment tracking)?
3. **Use Automation System** (extend existing automation)?

Let me know which approach you prefer, and I'll implement it immediately!
