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
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Bulk reminder sending failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Failed to send bulk reminders' }, { status: 500 });
  }
}
