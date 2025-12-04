# Payment Reminder System - Complete Implementation Guide

**Status**: Database schema updated, migration running, PDF dependencies installed
**Remaining**: Repository, Services, API, Cron Jobs
**Estimated Time**: 2-3 hours
**Date**: December 2, 2025

---

## 📋 What's Already Done

### ✅ Completed

1. Database schema updated with:
   - User: Banking details fields (bankName, bankAccountName, bankAccountNumber, bankBranchCode, bankSwiftCode, paymentInstructions)
   - Tenant: Payment config fields (monthlyRent, paymentDueDay, nextPaymentDue, lastPaymentDate, reminderDaysBefore, autoSendReminder)
   - Payment: Enhanced with (propertyId, dueDate, invoiceNumber, invoiceUrl, reminderSent, reminderSentAt, reminderCount, description)
   - PaymentStatus enum: Added OVERDUE status
2. Migration created: `add_payment_reminder_system`
3. Dependencies installed: pdfkit, @types/pdfkit
4. Directory structure created: `lib/features/payments/{dtos,repositories,services,utils,templates}`

---

## 🎯 Implementation Steps

### Step 1: Create Payment DTOs

**File**: `lib/features/payments/dtos/payment.dto.ts`

```typescript
import { z } from 'zod';
import { PaymentType, PaymentMethod, PaymentStatus } from '@prisma/client';

export const createPaymentSchema = z.object({
  tenantId: z.string().optional(),
  bookingId: z.string().optional(),
  propertyId: z.string().optional(),
  paymentType: z.nativeEnum(PaymentType),
  amount: z.number().positive(),
  currency: z.string().default('ZAR'),
  dueDate: z.coerce.date().optional(),
  paymentDate: z.coerce.date().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
  description: z.string().optional(),
  notes: z.string().optional(),
  bankReference: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  paymentDate: z.coerce.date().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  notes: z.string().optional(),
  bankReference: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const generateMonthlyPaymentsSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2025),
});

export const paymentIdSchema = z.object({
  id: z.string(),
});

export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentDTO = z.infer<typeof updatePaymentSchema>;
export type GenerateMonthlyPaymentsDTO = z.infer<typeof generateMonthlyPaymentsSchema>;
```

---

### Step 2: Create Payment Repository

**File**: `lib/features/payments/repositories/payment.repository.ts`

```typescript
import { prisma } from '@/lib/db';
import { PaymentStatus, Prisma } from '@prisma/client';

export class PaymentRepository {
  /**
   * Find all payments for a user with optional filters
   */
  async findAll(
    userId: string,
    filters?: {
      tenantId?: string;
      status?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    return prisma.payment.findMany({
      where: {
        userId,
        ...(filters?.tenantId && { tenantId: filters.tenantId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate &&
          filters?.endDate && {
            dueDate: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  /**
   * Find payment by ID with full details for invoice generation
   */
  async findById(id: string, userId: string) {
    return prisma.payment.findFirst({
      where: { id, userId },
      include: {
        tenant: true,
        property: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true,
            bankName: true,
            bankAccountName: true,
            bankAccountNumber: true,
            bankBranchCode: true,
            bankSwiftCode: true,
            paymentInstructions: true,
          },
        },
      },
    });
  }

  /**
   * Find payments due on a specific date that need reminders
   */
  async findDuePayments(userId: string, targetDate: Date) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.PENDING,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        reminderSent: false,
      },
      include: {
        tenant: true,
        property: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            bankName: true,
            bankAccountName: true,
            bankAccountNumber: true,
            bankBranchCode: true,
            paymentInstructions: true,
          },
        },
      },
    });
  }

  /**
   * Find overdue payments that need to be marked as OVERDUE
   */
  async findOverduePayments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        dueDate: {
          lt: today,
        },
      },
    });
  }

  /**
   * Create a new payment
   */
  async create(
    userId: string,
    data: {
      tenantId?: string;
      bookingId?: string;
      propertyId?: string;
      paymentType: string;
      amount: number;
      currency?: string;
      dueDate?: Date;
      description?: string;
      notes?: string;
    }
  ) {
    // Generate unique payment reference
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ref = `PAY-${timestamp}-${random}`;

    return prisma.payment.create({
      data: {
        userId,
        tenantId: data.tenantId,
        bookingId: data.bookingId,
        propertyId: data.propertyId,
        paymentReference: ref,
        paymentType: data.paymentType as any,
        amount: data.amount,
        currency: data.currency || 'ZAR',
        dueDate: data.dueDate,
        description: data.description,
        notes: data.notes,
        status: PaymentStatus.PENDING,
      },
    });
  }

  /**
   * Update payment
   */
  async update(id: string, userId: string, data: Prisma.PaymentUpdateInput) {
    return prisma.payment.updateMany({
      where: { id, userId },
      data,
    });
  }

  /**
   * Mark payment reminder as sent
   */
  async markReminderSent(paymentId: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        reminderSent: true,
        reminderSentAt: new Date(),
        reminderCount: { increment: 1 },
      },
    });
  }

  /**
   * Mark multiple payments as overdue
   */
  async markOverdue(paymentIds: string[]) {
    return prisma.payment.updateMany({
      where: {
        id: { in: paymentIds },
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.OVERDUE,
      },
    });
  }

  /**
   * Generate monthly rent payments for all active tenants
   */
  async generateMonthlyPayments(userId: string, month: number, year: number) {
    // Find all active tenants with monthly rent configured
    const tenants = await prisma.tenant.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        monthlyRent: { not: null },
        paymentDueDay: { not: null },
      },
      include: {
        properties: {
          include: {
            property: true,
          },
        },
      },
    });

    const payments = [];

    for (const tenant of tenants) {
      const property = tenant.properties[0]?.property;

      // Calculate due date
      const dueDay = tenant.paymentDueDay || 1;
      const dueDate = new Date(year, month - 1, dueDay, 9, 0, 0);

      // Check if payment already exists for this month
      const existing = await prisma.payment.findFirst({
        where: {
          userId,
          tenantId: tenant.id,
          paymentType: 'RENT',
          dueDate: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0),
          },
        },
      });

      if (!existing) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const paymentRef = `PAY-${timestamp}-${random}`;
        const invoiceNum = `INV-${year}${month.toString().padStart(2, '0')}-${tenant.id.slice(0, 8).toUpperCase()}`;

        payments.push({
          userId,
          tenantId: tenant.id,
          propertyId: property?.id,
          paymentReference: paymentRef,
          paymentType: 'RENT',
          amount: tenant.monthlyRent!,
          currency: 'ZAR',
          dueDate,
          status: PaymentStatus.PENDING,
          invoiceNumber: invoiceNum,
          description: `Rent for ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        });
      }
    }

    if (payments.length > 0) {
      await prisma.payment.createMany({
        data: payments as any,
        skipDuplicates: true,
      });
    }

    return { count: payments.length };
  }
}

export const paymentRepository = new PaymentRepository();
```

---

### Step 3: Create Invoice Generation Service

**File**: `lib/features/payments/services/invoice.service.ts`

```typescript
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';

type PaymentWithDetails = {
  id: string;
  invoiceNumber: string | null;
  amount: any;
  dueDate: Date | null;
  description: string | null;
  currency: string;
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null;
  property: {
    name: string;
    address: string;
  } | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    companyName: string | null;
    bankName: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
    bankBranchCode: string | null;
    bankSwiftCode: string | null;
    paymentInstructions: string | null;
  };
};

export class InvoiceService {
  private invoicesDir = path.join(process.cwd(), 'public', 'invoices');

  /**
   * Generate PDF invoice for a payment
   */
  async generateInvoice(payment: PaymentWithDetails): Promise<string> {
    // Ensure invoices directory exists
    await mkdir(this.invoicesDir, { recursive: true });

    const fileName = `invoice-${payment.invoiceNumber}.pdf`;
    const filePath = path.join(this.invoicesDir, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('RENTAL INVOICE', { align: 'center' });
      doc.moveDown();

      // Invoice details box
      doc.fontSize(10).font('Helvetica');
      const invoiceDetailsY = doc.y;
      doc.text(`Invoice Number: ${payment.invoiceNumber}`, { continued: false });
      doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Due Date: ${payment.dueDate?.toLocaleDateString() || 'N/A'}`);
      doc.moveDown();

      // From (Landlord/Owner)
      doc.fontSize(12).font('Helvetica-Bold').text('FROM:', { underline: true });
      doc.fontSize(10).font('Helvetica');
      const ownerName =
        payment.user.companyName || `${payment.user.firstName} ${payment.user.lastName}`;
      doc.text(ownerName);
      doc.text(payment.user.email);
      if (payment.user.phone) doc.text(payment.user.phone);
      doc.moveDown();

      // To (Tenant)
      doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:', { underline: true });
      doc.fontSize(10).font('Helvetica');
      if (payment.tenant) {
        doc.text(`${payment.tenant.firstName} ${payment.tenant.lastName}`);
        doc.text(payment.tenant.email);
        doc.text(payment.tenant.phone);
      }
      doc.moveDown();

      // Property Details
      if (payment.property) {
        doc.fontSize(12).font('Helvetica-Bold').text('PROPERTY:', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(payment.property.name);
        doc.text(payment.property.address);
        doc.moveDown();
      }

      // Payment table
      doc.fontSize(12).font('Helvetica-Bold').text('PAYMENT DETAILS', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const descriptionX = 50;
      const amountX = 400;

      // Table headers
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', descriptionX, tableTop);
      doc.text('Amount', amountX, tableTop, { align: 'right', width: 100 });

      // Line under headers
      doc
        .moveTo(50, tableTop + 20)
        .lineTo(500, tableTop + 20)
        .stroke();

      // Payment item
      const itemY = tableTop + 30;
      doc.font('Helvetica').fontSize(10);
      doc.text(payment.description || 'Monthly Rent', descriptionX, itemY);
      doc.text(`${payment.currency} ${Number(payment.amount).toFixed(2)}`, amountX, itemY, {
        align: 'right',
        width: 100,
      });

      // Total line
      doc
        .moveTo(50, itemY + 30)
        .lineTo(500, itemY + 30)
        .stroke();

      // Total
      const totalY = itemY + 40;
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL DUE', descriptionX, totalY);
      doc.text(`${payment.currency} ${Number(payment.amount).toFixed(2)}`, amountX, totalY, {
        align: 'right',
        width: 100,
      });

      doc.moveDown(3);

      // Banking details
      if (payment.user.bankName) {
        doc.fontSize(12).font('Helvetica-Bold').text('PAYMENT INSTRUCTIONS', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.moveDown(0.5);

        doc.text(`Bank Name: ${payment.user.bankName}`);
        doc.text(`Account Name: ${payment.user.bankAccountName || 'N/A'}`);
        doc.text(`Account Number: ${payment.user.bankAccountNumber || 'N/A'}`);
        if (payment.user.bankBranchCode) {
          doc.text(`Branch Code: ${payment.user.bankBranchCode}`);
        }
        if (payment.user.bankSwiftCode) {
          doc.text(`SWIFT Code: ${payment.user.bankSwiftCode}`);
        }

        if (payment.user.paymentInstructions) {
          doc.moveDown();
          doc.fontSize(9).text('Additional Instructions:', { continued: false });
          doc.text(payment.user.paymentInstructions);
        }
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').fillColor('#666');
      doc.text(`Please include invoice number ${payment.invoiceNumber} as payment reference.`, {
        align: 'center',
      });
      doc.text(`For any questions, contact us at ${payment.user.email}`, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(`/invoices/${fileName}`);
      });

      stream.on('error', reject);
    });
  }

  /**
   * Generate HTML invoice (alternative to PDF)
   */
  generateInvoiceHTML(payment: PaymentWithDetails): string {
    const ownerName =
      payment.user.companyName || `${payment.user.firstName} ${payment.user.lastName}`;
    const tenantName = payment.tenant
      ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
      : 'N/A';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${payment.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px; }
    .header h1 { margin: 0; color: #333; }
    .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .total-row { font-weight: bold; font-size: 16px; background-color: #f9f9f9; }
    .banking { background-color: #f0f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; border-top: 2px solid #eee; padding-top: 20px; }
    .amount { text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RENTAL INVOICE</h1>
    <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Invoice #${payment.invoiceNumber}</p>
  </div>

  <div class="invoice-details">
    <div>
      <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Due Date:</strong> ${payment.dueDate?.toLocaleDateString() || 'N/A'}</p>
    </div>
    <div style="text-align: right;">
      ${payment.property ? `<p><strong>Property:</strong> ${payment.property.name}</p><p style="font-size: 12px; color: #666;">${payment.property.address}</p>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">FROM</div>
    <p><strong>${ownerName}</strong></p>
    <p>${payment.user.email}</p>
    ${payment.user.phone ? `<p>${payment.user.phone}</p>` : ''}
  </div>

  <div class="section">
    <div class="section-title">BILL TO</div>
    <p><strong>${tenantName}</strong></p>
    ${payment.tenant ? `<p>${payment.tenant.email}</p><p>${payment.tenant.phone}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${payment.description || 'Monthly Rent'}</td>
        <td class="amount">${payment.currency} ${Number(payment.amount).toFixed(2)}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td>TOTAL DUE</td>
        <td class="amount">${payment.currency} ${Number(payment.amount).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  ${
    payment.user.bankName
      ? `
  <div class="section banking">
    <div class="section-title">PAYMENT INSTRUCTIONS</div>
    <p><strong>Bank Name:</strong> ${payment.user.bankName}</p>
    <p><strong>Account Name:</strong> ${payment.user.bankAccountName || 'N/A'}</p>
    <p><strong>Account Number:</strong> ${payment.user.bankAccountNumber || 'N/A'}</p>
    ${payment.user.bankBranchCode ? `<p><strong>Branch Code:</strong> ${payment.user.bankBranchCode}</p>` : ''}
    ${payment.user.bankSwiftCode ? `<p><strong>SWIFT Code:</strong> ${payment.user.bankSwiftCode}</p>` : ''}
    ${payment.user.paymentInstructions ? `<p style="margin-top: 15px; font-style: italic; color: #555;">${payment.user.paymentInstructions}</p>` : ''}
  </div>
  `
      : ''
  }

  <div class="footer">
    <p><strong>Please include invoice number ${payment.invoiceNumber} as payment reference</strong></p>
    <p>For any questions, contact ${payment.user.email}</p>
  </div>
</body>
</html>
    `;
  }
}

export const invoiceService = new InvoiceService();
```

---

### Step 4: Create Payment Service

**File**: `lib/features/payments/services/payment.service.ts`

```typescript
import { paymentRepository } from '../repositories/payment.repository';
import { invoiceService } from './invoice.service';
import { CreatePaymentDTO, UpdatePaymentDTO } from '../dtos/payment.dto';
import { prisma } from '@/lib/db';

export class PaymentService {
  async getAll(
    organizationId: string,
    filters?: {
      tenantId?: string;
      status?: any;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    return paymentRepository.findAll(organizationId, filters);
  }

  async getById(id: string, organizationId: string) {
    const payment = await paymentRepository.findById(id, organizationId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  }

  async create(organizationId: string, data: CreatePaymentDTO) {
    // Validate tenant belongs to organization if provided
    if (data.tenantId) {
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: data.tenantId,
          userId: organizationId,
        },
      });

      if (!tenant) {
        throw new Error('Tenant not found or does not belong to your organization');
      }
    }

    return paymentRepository.create(organizationId, data);
  }

  async update(id: string, organizationId: string, data: UpdatePaymentDTO) {
    // Verify payment exists and belongs to organization
    await this.getById(id, organizationId);

    await paymentRepository.update(id, organizationId, data);
    return this.getById(id, organizationId);
  }

  async generateInvoice(id: string, organizationId: string) {
    const payment = await paymentRepository.findById(id, organizationId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Generate PDF invoice
    const invoiceUrl = await invoiceService.generateInvoice(payment as any);

    // Update payment with invoice URL
    await paymentRepository.update(id, organizationId, {
      invoiceUrl,
    });

    return { invoiceUrl };
  }

  async generateMonthlyPayments(organizationId: string, month: number, year: number) {
    return paymentRepository.generateMonthlyPayments(organizationId, month, year);
  }

  async markOverduePayments() {
    const overduePayments = await paymentRepository.findOverduePayments();
    const paymentIds = overduePayments.map((p) => p.id);

    if (paymentIds.length > 0) {
      await paymentRepository.markOverdue(paymentIds);
    }

    return { count: paymentIds.length };
  }
}

export const paymentService = new PaymentService();
```

---

### Step 5: Create Payment API Endpoints

**File**: `app/api/payments/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { paymentService } from '@/lib/features/payments/services/payment.service';
import { createPaymentSchema } from '@/lib/features/payments/dtos/payment.dto';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const filters = {
      tenantId: searchParams.get('tenantId') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    const payments = await paymentService.getAll(session.user.organizationId, filters);

    return NextResponse.json(payments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const validatedData = createPaymentSchema.parse(body);

    const payment = await paymentService.create(session.user.organizationId, validatedData);

    await logAudit(session, 'created', 'payment', payment.id, undefined, request);

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

**File**: `app/api/payments/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { paymentService } from '@/lib/features/payments/services/payment.service';
import { updatePaymentSchema, paymentIdSchema } from '@/lib/features/payments/dtos/payment.dto';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    paymentIdSchema.parse({ id });

    const payment = await paymentService.getById(id, session.user.organizationId);

    return NextResponse.json(payment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    paymentIdSchema.parse({ id });
    const validatedData = updatePaymentSchema.parse(body);

    const oldPayment = await paymentService.getById(id, session.user.organizationId);
    const payment = await paymentService.update(id, session.user.organizationId, validatedData);

    await logAudit(
      session,
      'updated',
      'payment',
      id,
      {
        before: { status: oldPayment.status, paymentDate: oldPayment.paymentDate },
        after: { status: payment.status, paymentDate: payment.paymentDate },
      },
      request
    );

    return NextResponse.json(payment);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**File**: `app/api/payments/[id]/generate-invoice/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { paymentService } from '@/lib/features/payments/services/payment.service';
import { paymentIdSchema } from '@/lib/features/payments/dtos/payment.dto';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    paymentIdSchema.parse({ id });

    const result = await paymentService.generateInvoice(id, session.user.organizationId);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### Step 6: Create Cron Job Endpoints

**File**: `app/api/payments/generate-monthly/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paymentRepository } from '@/lib/features/payments/repositories/payment.repository';

/**
 * Generate monthly rent payments for all tenants
 * Runs on 25th of each month to generate next month's payments
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all organization owners
    const organizations = await prisma.user.findMany({
      where: {
        organizationId: null, // Only organization owners
      },
      select: {
        id: true,
      },
    });

    let totalGenerated = 0;

    // Calculate next month
    const now = new Date();
    const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2; // getMonth() is 0-indexed
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

    // Generate payments for each organization
    for (const org of organizations) {
      try {
        const result = await paymentRepository.generateMonthlyPayments(org.id, nextMonth, nextYear);
        totalGenerated += result.count;
      } catch (error) {
        console.error(`Failed to generate payments for org ${org.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalGenerated,
      month: `${nextMonth}/${nextYear}`,
    });
  } catch (error) {
    console.error('Monthly payment generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate monthly payments' }, { status: 500 });
  }
}
```

**File**: `app/api/payments/send-reminders/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paymentRepository } from '@/lib/features/payments/repositories/payment.repository';
import { invoiceService } from '@/lib/features/payments/services/invoice.service';
import { sendEmail } from '@/lib/email';

/**
 * Send payment reminders for payments due in X days
 * Runs daily at 9 AM
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all organization owners
    const organizations = await prisma.user.findMany({
      where: { organizationId: null },
      select: { id: true },
    });

    let totalSent = 0;

    for (const org of organizations) {
      // Get tenants with their reminder preferences
      const tenants = await prisma.tenant.findMany({
        where: {
          userId: org.id,
          status: 'ACTIVE',
          autoSendReminder: true,
          reminderDaysBefore: { not: null },
        },
      });

      for (const tenant of tenants) {
        // Calculate reminder date (X days before due date)
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + (tenant.reminderDaysBefore || 3));

        // Find payments due on that date
        const duePayments = await paymentRepository.findDuePayments(org.id, reminderDate);

        for (const payment of duePayments) {
          try {
            // Generate invoice if not already generated
            if (!payment.invoiceUrl) {
              const invoiceUrl = await invoiceService.generateInvoice(payment as any);
              await prisma.payment.update({
                where: { id: payment.id },
                data: { invoiceUrl },
              });
              payment.invoiceUrl = invoiceUrl;
            }

            // Send email with invoice
            const invoiceHtml = invoiceService.generateInvoiceHTML(payment as any);

            await sendEmail({
              to: payment.tenant!.email,
              subject: `Rent Payment Reminder - Due ${payment.dueDate?.toLocaleDateString()}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Rent Payment Reminder</h2>
                  <p>Dear ${payment.tenant!.firstName},</p>
                  <p>This is a friendly reminder that your rent payment of <strong>${payment.currency} ${Number(payment.amount).toFixed(2)}</strong> is due on <strong>${payment.dueDate?.toLocaleDateString()}</strong>.</p>
                  ${payment.property ? `<p><strong>Property:</strong> ${payment.property.name}</p>` : ''}
                  <p>Please find your invoice below with payment instructions.</p>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                  ${invoiceHtml}
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                  <p style="font-size: 12px; color: #666;">If you have already made this payment, please disregard this reminder.</p>
                  <p>Thank you!</p>
                </div>
              `,
            });

            // Mark reminder as sent
            await paymentRepository.markReminderSent(payment.id);
            totalSent++;
          } catch (error) {
            console.error(`Failed to send reminder for payment ${payment.id}:`, error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: totalSent,
    });
  } catch (error) {
    console.error('Payment reminder sending failed:', error);
    return NextResponse.json({ error: 'Failed to send payment reminders' }, { status: 500 });
  }
}
```

**File**: `app/api/payments/mark-overdue/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { paymentService } from '@/lib/features/payments/services/payment.service';

/**
 * Mark overdue payments
 * Runs daily at midnight
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await paymentService.markOverduePayments();

    return NextResponse.json({
      success: true,
      markedOverdue: result.count,
    });
  } catch (error) {
    console.error('Mark overdue failed:', error);
    return NextResponse.json({ error: 'Failed to mark overdue payments' }, { status: 500 });
  }
}
```

---

### Step 7: Update vercel.json

**File**: `vercel.json`

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
    },
    {
      "path": "/api/payments/mark-overdue",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Cron Schedules Explained**:

- `*/10 * * * *` - Every 10 minutes (message processing)
- `0 0 25 * *` - At midnight on the 25th of each month (generate next month's payments)
- `0 9 * * *` - Daily at 9 AM (send payment reminders)
- `0 0 * * *` - Daily at midnight (mark overdue payments)

---

### Step 8: Create Public Exports

**File**: `lib/features/payments/index.ts`

```typescript
export * from './dtos/payment.dto';
export * from './repositories/payment.repository';
export * from './services/payment.service';
export * from './services/invoice.service';
```

---

### Step 9: Update Audit Types

**File**: `lib/shared/audit.ts`

Add 'payment' to the AuditEntity type union (if not already present):

```typescript
export type AuditEntity =
  | 'property'
  | 'booking'
  | 'tenant'
  | 'payment' // Add this if missing
  | 'expense';
// ... rest
```

---

### Step 10: Create Invoices Directory

```bash
mkdir -p public/invoices
echo "*" > public/invoices/.gitignore
echo "!.gitignore" >> public/invoices/.gitignore
```

This ensures the invoices directory exists but invoice PDFs are not committed to git.

---

## ✅ Testing Checklist

### 1. Database Migration

```bash
# Check migration status
npx prisma migrate status

# If needed, apply migration
npx prisma migrate dev --name add_payment_reminder_system

# Generate Prisma client
npx prisma generate
```

### 2. Type Check

```bash
npm run type-check
```

### 3. Manual API Testing

#### Create a Monthly Payment

```bash
POST /api/payments
{
  "tenantId": "tenant-id-here",
  "propertyId": "property-id-here",
  "paymentType": "RENT",
  "amount": 15000,
  "dueDate": "2025-01-01",
  "description": "Rent for January 2025"
}
```

#### Generate Invoice

```bash
POST /api/payments/{payment-id}/generate-invoice
```

#### Test Monthly Generation (with CRON_SECRET)

```bash
POST /api/payments/generate-monthly
Headers: Authorization: Bearer YOUR_CRON_SECRET
```

#### Test Reminder Sending (with CRON_SECRET)

```bash
POST /api/payments/send-reminders
Headers: Authorization: Bearer YOUR_CRON_SECRET
```

---

## 🔧 Required Environment Variables

Add to `.env`:

```bash
# Already exists from messaging system
CRON_SECRET="your-32-char-random-secret"

# Email settings (should already exist)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@property-crm.com"
```

---

## 📊 How It Works

### Monthly Flow:

1. **25th of each month** (midnight):
   - Cron calls `/api/payments/generate-monthly`
   - System finds all active tenants with `monthlyRent` configured
   - Creates Payment records for next month
   - Each payment gets unique invoice number

2. **Every day** (9 AM):
   - Cron calls `/api/payments/send-reminders`
   - System finds payments due in X days (based on tenant's `reminderDaysBefore` setting)
   - Generates PDF invoice (if not already generated)
   - Sends email with invoice and banking details
   - Marks payment as `reminderSent = true`

3. **Every day** (midnight):
   - Cron calls `/api/payments/mark-overdue`
   - System finds payments past due date with status PENDING
   - Updates status to OVERDUE

---

## 🎨 Example Email Content

When a tenant receives a payment reminder, they get:

**Subject**: Rent Payment Reminder - Due 01/01/2025

**Body**:

- Friendly greeting with tenant name
- Amount due and due date highlighted
- Property name
- Full PDF invoice embedded in email with:
  - Invoice number
  - Payment breakdown
  - Banking details
  - Payment instructions
  - Reference number to use

---

## 🔍 Troubleshooting

### Issue: Invoices not generating

- **Check**: `public/invoices` directory exists
- **Check**: Write permissions on directory
- **Solution**: `mkdir -p public/invoices && chmod 755 public/invoices`

### Issue: PDFs appear corrupt

- **Check**: pdfkit version compatibility
- **Solution**: `npm install pdfkit@latest`

### Issue: Reminders not sending

- **Check**: `CRON_SECRET` environment variable set
- **Check**: Tenants have `autoSendReminder = true`
- **Check**: Payments have `dueDate` set
- **Solution**: Query database to verify tenant and payment configuration

### Issue: Duplicate payments generated

- **Check**: Payment generation logic checks for existing payments
- **Solution**: Code already handles duplicates with `skipDuplicates: true`

---

## 📝 Next Steps After Implementation

1. **Set up tenant payment configuration**:
   - Update existing tenants with `monthlyRent`, `paymentDueDay`, `reminderDaysBefore`

2. **Configure banking details**:
   - Update User model with bank account information via settings page

3. **Test the complete flow**:
   - Manually trigger monthly generation
   - Verify payment records created
   - Manually trigger reminder sending
   - Check email delivery
   - Verify PDF invoice generated

4. **Monitor cron jobs**:
   - Check Vercel dashboard for cron job execution logs
   - Set up alerts for failed cron jobs

5. **Build frontend UI** (future):
   - Payment list page (`/payments`)
   - Payment detail page with invoice download
   - Tenant payment configuration form
   - Banking details settings page

---

## 🚀 Deployment Checklist

- [ ] Database migration applied
- [ ] Prisma client generated
- [ ] All files created
- [ ] Type check passing
- [ ] CRON_SECRET set in production
- [ ] Email SMTP configured
- [ ] `public/invoices` directory exists with .gitignore
- [ ] vercel.json cron jobs configured
- [ ] Test email sending works
- [ ] Test PDF generation works
- [ ] At least one tenant configured with payment settings

---

**Status**: Ready for implementation
**Estimated Completion**: 2-3 hours
**Priority**: High - Enables automated rental income management

Give this document to Claude and say: "Implement the Payment Reminder System following this guide step by step."
