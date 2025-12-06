# Payment Reminder UI Implementation Guide

**Date**: December 2, 2025
**Status**: In Progress

---

## Overview

This document outlines the remaining UI/UX implementation for the Payment Reminder System:

1. ✅ Banking Details Settings Page (COMPLETED)
2. ⏳ Manual Payment Reminder Trigger
3. ⏳ Tenant Portal - Payment Reminders View
4. ⏳ Admin Payments Page Enhancements

---

## 1. Banking Details Settings (COMPLETED ✅)

### Location

- **Page**: `/settings/banking`
- **API**: `/api/settings/banking` (GET, PUT)

### Features

- ✅ Form to enter banking details
- ✅ Preview of how details appear on invoices
- ✅ Validation for required fields
- ✅ Success/error notifications
- ✅ Audit logging

### Fields

- Bank Name (required)
- Account Name (required)
- Account Number (required)
- Branch Code (optional)
- SWIFT Code (optional)
- Payment Instructions (optional)

---

## 2. Manual Payment Reminder Trigger (TODO)

### Requirements

Landlords should be able to:

1. Trigger payment reminders manually from admin panel
2. Send reminder for a specific payment
3. Send bulk reminders for multiple payments
4. View reminder history

### Implementation

#### A. API Endpoint: Send Single Payment Reminder

**File**: `app/api/payments/[id]/send-reminder/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { paymentRepository } from '@/lib/features/payments/repositories/payment.repository';
import { invoiceService } from '@/lib/features/payments/services/invoice.service';
import { sendEmail } from '@/lib/email';
import { logAudit } from '@/lib/shared/audit';
import { logger } from '@/lib/shared/logger';

/**
 * POST /api/payments/[id]/send-reminder
 * Manually send payment reminder for a specific payment
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const paymentId = params.id;

    // Find payment
    const payment = await paymentRepository.findById(paymentId, session.user.organizationId);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment has a tenant with email
    if (!payment.tenant || !payment.tenant.email) {
      return NextResponse.json(
        { error: 'Payment has no tenant or tenant has no email' },
        { status: 400 }
      );
    }

    // Check if payment is in valid status for reminder
    if (payment.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot send reminder for paid payment' }, { status: 400 });
    }

    // Generate invoice HTML
    const invoiceHTML = invoiceService.generateInvoiceHTML(payment);

    // Send email
    const emailResult = await sendEmail({
      to: payment.tenant.email,
      subject: `Payment Reminder - Due ${payment.dueDate?.toLocaleDateString('en-ZA')}`,
      html: invoiceHTML,
      from: payment.user.email || undefined,
      replyTo: payment.user.email || undefined,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }

    // Mark reminder as sent
    await paymentRepository.markReminderSent(paymentId);

    // Log audit
    await logAudit(
      session,
      'created',
      'payment',
      paymentId,
      { action: 'manual_reminder_sent', tenant: payment.tenant.name },
      request
    );

    logger.info('Manual payment reminder sent', {
      paymentId,
      tenantId: payment.tenantId,
      userId: session.user.id,
      messageId: emailResult.messageId,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment reminder sent successfully',
      messageId: emailResult.messageId,
    });
  } catch (error) {
    logger.error('Failed to send manual payment reminder', {
      paymentId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Failed to send payment reminder',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
```

#### B. API Endpoint: Send Bulk Reminders

**File**: `app/api/payments/send-bulk-reminders/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-helpers';
import { paymentRepository } from '@/lib/features/payments/repositories/payment.repository';
import { invoiceService } from '@/lib/features/payments/services/invoice.service';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/shared/logger';

const bulkReminderSchema = z.object({
  paymentIds: z.array(z.string()).min(1, 'At least one payment ID required'),
});

/**
 * POST /api/payments/send-bulk-reminders
 * Send payment reminders for multiple payments
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { paymentIds } = bulkReminderSchema.parse(body);

    let successCount = 0;
    let failureCount = 0;
    const results: Array<{ paymentId: string; success: boolean; error?: string }> = [];

    for (const paymentId of paymentIds) {
      try {
        const payment = await paymentRepository.findById(paymentId, session.user.organizationId);

        if (!payment || !payment.tenant?.email) {
          results.push({
            paymentId,
            success: false,
            error: 'Payment or tenant email not found',
          });
          failureCount++;
          continue;
        }

        if (payment.status === 'PAID') {
          results.push({
            paymentId,
            success: false,
            error: 'Payment already paid',
          });
          failureCount++;
          continue;
        }

        const invoiceHTML = invoiceService.generateInvoiceHTML(payment);

        const emailResult = await sendEmail({
          to: payment.tenant.email,
          subject: `Payment Reminder - Due ${payment.dueDate?.toLocaleDateString('en-ZA')}`,
          html: invoiceHTML,
          from: payment.user.email || undefined,
        });

        if (emailResult.success) {
          await paymentRepository.markReminderSent(paymentId);
          results.push({ paymentId, success: true });
          successCount++;
        } else {
          results.push({
            paymentId,
            success: false,
            error: emailResult.error || 'Failed to send email',
          });
          failureCount++;
        }
      } catch (error) {
        results.push({
          paymentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failureCount++;
      }
    }

    logger.info('Bulk payment reminders sent', {
      userId: session.user.id,
      totalRequested: paymentIds.length,
      successCount,
      failureCount,
    });

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} reminders, ${failureCount} failed`,
      results,
      summary: {
        total: paymentIds.length,
        sent: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Bulk reminder sending failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Failed to send bulk reminders' }, { status: 500 });
  }
}
```

#### C. Frontend: Add "Send Reminder" Button to Payments Page

Add to your payments page (wherever payments are displayed):

```typescript
// In your payments table/list component
import { Mail } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function PaymentRow({ payment }: { payment: Payment }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendReminder = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(`/api/payments/${paymentId}/send-reminder`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reminder');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reminder sent',
        description: 'Payment reminder has been sent to the tenant',
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const canSendReminder = payment.status !== 'PAID' && payment.tenant?.email;

  return (
    <div className="flex items-center gap-2">
      {/* ... other payment info ... */}

      <Button
        size="sm"
        variant="outline"
        disabled={!canSendReminder || sendReminder.isPending}
        onClick={() => sendReminder.mutate(payment.id)}
      >
        <Mail className="mr-2 h-4 w-4" />
        {sendReminder.isPending ? 'Sending...' : 'Send Reminder'}
      </Button>
    </div>
  );
}
```

---

## 3. Tenant Portal - Payment Reminders View (TODO)

### Requirements

Tenants should be able to:

1. View all their payment reminders
2. See payment status (pending, paid, overdue)
3. Download/view invoice
4. Mark payment as paid (with proof upload)
5. See payment history

### Implementation

#### A. Tenant Payments API

**File**: `app/api/tenant/payments/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

/**
 * GET /api/tenant/payments
 * Get all payments for the logged-in tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Check if user is a tenant
    if (session.user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Unauthorized - Tenants only' }, { status: 403 });
    }

    // Find tenant record for this user
    const tenant = await prisma.tenant.findFirst({
      where: { email: session.user.email },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    // Get all payments for this tenant
    const payments = await prisma.payment.findMany({
      where: { tenantId: tenant.id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    return NextResponse.json({
      payments,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
```

#### B. Tenant Invoice View API

**File**: `app/api/tenant/payments/[id]/invoice/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { paymentRepository } from '@/lib/features/payments/repositories/payment.repository';
import { invoiceService } from '@/lib/features/payments/services/invoice.service';

/**
 * GET /api/tenant/payments/[id]/invoice
 * Get invoice HTML for a payment
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();

    if (session.user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get payment and verify it belongs to this tenant
    const payment = await paymentRepository.findById(params.id);

    if (!payment || payment.tenant?.email !== session.user.email) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Generate invoice HTML
    const invoiceHTML = invoiceService.generateInvoiceHTML(payment);

    // Return as HTML
    return new NextResponse(invoiceHTML, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
```

#### C. Tenant Portal Page

**File**: `app/(tenant)/payments/page.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  status: string;
  description: string | null;
  property: {
    name: string;
    address: string | null;
  } | null;
}

export default function TenantPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['tenant-payments'],
    queryFn: async () => {
      const response = await fetch('/api/tenant/payments');
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      PAID: 'default',
      PENDING: 'secondary',
      OVERDUE: 'destructive',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const overduePayments = data?.payments?.filter(
    (p: Payment) => p.status === 'OVERDUE'
  ).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Payments</h1>
        <p className="text-muted-foreground">
          View your rent payments and download invoices
        </p>
      </div>

      {overduePayments > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {overduePayments} overdue payment{overduePayments > 1 ? 's' : ''}.
            Please make payment as soon as possible.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : data?.payments?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No payments found
              </p>
            </CardContent>
          </Card>
        ) : (
          data?.payments?.map((payment: Payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {payment.description || 'Rent Payment'}
                      {getStatusBadge(payment.status)}
                    </CardTitle>
                    <CardDescription>
                      {payment.property?.name} - {payment.property?.address}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {payment.currency} {Number(payment.amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Due: {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/api/tenant/payments/${payment.id}/invoice`, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    View Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 4. Admin Payments Page Enhancements (TODO)

### Features to Add

1. Filter by payment status
2. Filter by tenant
3. Search payments
4. Bulk actions (send reminders, export)
5. Payment statistics cards

### Example Filter Component

```typescript
<div className="flex gap-4">
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-40">
      <SelectValue placeholder="Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Status</SelectItem>
      <SelectItem value="PENDING">Pending</SelectItem>
      <SelectItem value="PAID">Paid</SelectItem>
      <SelectItem value="OVERDUE">Overdue</SelectItem>
    </SelectContent>
  </Select>

  <Button
    variant="outline"
    onClick={() => sendBulkReminders(selectedPaymentIds)}
    disabled={selectedPaymentIds.length === 0}
  >
    <Mail className="mr-2 h-4 w-4" />
    Send Reminders ({selectedPaymentIds.length})
  </Button>
</div>
```

---

## Summary

### Completed ✅

1. Banking Details Settings Page
   - Form to enter bank information
   - API endpoint for GET/PUT
   - Preview of invoice display
   - Navigation link in settings

### TODO ⏳

1. Manual Payment Reminder Trigger
   - Single payment reminder API
   - Bulk reminder API
   - Frontend buttons

2. Tenant Portal
   - Payments list view
   - Invoice download
   - Payment status indicators

3. Admin Enhancements
   - Filters and search
   - Bulk actions
   - Statistics

---

## Next Steps

1. Create the manual reminder API endpoints
2. Add "Send Reminder" buttons to admin payments page
3. Create tenant portal payments page
4. Add bulk reminder functionality
5. Test end-to-end flow

---

**Priority**: High - Critical for landlord usability and tenant experience
**Estimated Time**: 4-6 hours for complete implementation
