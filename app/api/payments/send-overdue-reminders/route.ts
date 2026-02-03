import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { invoiceService } from '@/lib/features/payments/services/invoice.service';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/shared/logger';

/**
 * POST /api/payments/send-overdue-reminders
 * Cron job to send daily payment reminders for overdue payments
 * Runs daily at 10 AM
 * Schedule: 0 10 * * *
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('Unauthorized cron job access attempt', {
        path: '/api/payments/send-overdue-reminders',
        authHeader: authHeader ? '[REDACTED]' : 'missing',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting overdue payment reminder cron');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all overdue payments
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'OVERDUE',
        paymentType: 'RENT',
        dueDate: {
          lt: today,
        },
        tenant: {
          email: { not: null },
          status: 'ACTIVE',
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
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
    });

    let totalRemindersSent = 0;
    const results: Array<{
      paymentId: string;
      tenantEmail: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const payment of overduePayments) {
      if (!payment.tenant?.email) continue;

      try {
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(payment.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Generate invoice HTML with overdue notice
        const invoiceHTML = invoiceService.generateInvoiceHTML(payment);
        const invoiceText = invoiceService.generateInvoiceText(payment);

        // Add overdue notice to the HTML
        const overdueNotice = `
          <div style="background-color: #fee; border: 2px solid #f00; padding: 16px; margin: 16px 0; border-radius: 8px;">
            <h3 style="color: #d00; margin: 0 0 8px 0; font-size: 18px;">⚠️ PAYMENT OVERDUE</h3>
            <p style="margin: 0; color: #d00; font-size: 16px;">
              This payment is <strong>${daysOverdue} day${daysOverdue > 1 ? 's' : ''}</strong> overdue.
              Please make payment immediately to avoid further charges.
            </p>
          </div>
        `;

        const enhancedHTML = invoiceHTML.replace(
          '<div style="max-width: 800px',
          `<div style="max-width: 800px">` + overdueNotice + `<div style="max-width: 800px`
        );

        // Send email
        const emailResult = await sendEmail({
          to: payment.tenant.email,
          subject: `⚠️ OVERDUE: Rent Payment - ${daysOverdue} Day${daysOverdue > 1 ? 's' : ''} Late`,
          html: enhancedHTML,
          text: `PAYMENT OVERDUE\n\n${invoiceText}\n\nThis payment is ${daysOverdue} day(s) overdue. Please make payment immediately.`,
          from: payment.user.email || undefined,
          replyTo: payment.user.email || undefined,
        });

        if (emailResult.success) {
          // Update reminder sent timestamp (even for overdue, we track this)
          await prisma.payment.update({
            where: { id: payment.id },
            data: { reminderSentAt: new Date() },
          });

          totalRemindersSent++;

          logger.info('Overdue payment reminder sent', {
            paymentId: payment.id,
            tenantId: payment.tenant.id,
            tenantEmail: payment.tenant.email,
            daysOverdue,
            amount: payment.amount,
            messageId: emailResult.messageId,
          });

          results.push({
            paymentId: payment.id,
            tenantEmail: payment.tenant.email,
            success: true,
          });
        } else {
          logger.error('Failed to send overdue payment reminder email', {
            paymentId: payment.id,
            tenantId: payment.tenant.id,
            tenantEmail: payment.tenant.email,
            error: emailResult.error,
          });

          results.push({
            paymentId: payment.id,
            tenantEmail: payment.tenant.email,
            success: false,
            error: emailResult.error,
          });
        }
      } catch (error) {
        logger.error('Failed to send overdue payment reminder', {
          paymentId: payment.id,
          tenantId: payment.tenant?.id,
          error: error instanceof Error ? error.message : String(error),
        });

        results.push({
          paymentId: payment.id,
          tenantEmail: payment.tenant?.email || 'unknown',
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('Overdue payment reminder cron completed', {
      totalOverduePayments: overduePayments.length,
      totalRemindersSent,
    });

    return NextResponse.json({
      success: true,
      message: 'Overdue payment reminders sent successfully',
      data: {
        totalOverduePayments: overduePayments.length,
        totalRemindersSent,
        results,
      },
    });
  } catch (error) {
    logger.error('Overdue payment reminder cron failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send overdue payment reminders',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
