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
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const resolvedParams = await params;
    const paymentId = resolvedParams.id;

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
      {
        action: 'manual_reminder_sent',
        tenant: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
      },
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
