import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paymentService } from '@/lib/features/payments/services/payment.service';
import { invoiceService } from '@/lib/features/payments/services/invoice.service';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/shared/logger';

/**
 * POST /api/payments/send-reminders
 * Cron job to send payment reminders for upcoming due payments
 * Runs daily at 9 AM
 * Schedule: 0 9 * * *
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('Unauthorized cron job access attempt', {
        path: '/api/payments/send-reminders',
        authHeader: authHeader ? '[REDACTED]' : 'missing',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting payment reminder cron');

    // Get all organizations with active tenants
    const organizations = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        tenants: {
          some: {
            status: 'ACTIVE',
            autoSendReminder: true,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        email: true,
        tenants: {
          where: {
            status: 'ACTIVE',
            autoSendReminder: true,
            reminderDaysBefore: { not: null },
          },
        },
      },
    });

    let totalRemindersSent = 0;
    const results: Array<{
      organizationId: string;
      organizationName?: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const org of organizations) {
      const orgName = org.companyName || `${org.firstName} ${org.lastName}`;

      try {
        for (const tenant of org.tenants) {
          // Calculate reminder date based on tenant preference
          const reminderDate = new Date();
          reminderDate.setDate(reminderDate.getDate() + (tenant.reminderDaysBefore || 3));

          // Find payments due on that date
          const duePayments = await paymentService.findDuePayments(org.id, reminderDate);

          // Filter payments for this specific tenant
          const tenantPayments = duePayments.filter((p) => p.tenantId === tenant.id);

          for (const payment of tenantPayments) {
            try {
              // Generate invoice HTML
              const invoiceHTML = invoiceService.generateInvoiceHTML(payment);
              const invoiceText = invoiceService.generateInvoiceText(payment);

              // Send email
              const emailResult = await sendEmail({
                to: tenant.email,
                subject: `Rent Payment Reminder - Due ${payment.dueDate?.toLocaleDateString(
                  'en-ZA',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}`,
                html: invoiceHTML,
                text: invoiceText,
                from: org.email || undefined,
                replyTo: org.email || undefined,
              });

              if (emailResult.success) {
                // Mark reminder as sent
                await paymentService.markReminderSent(payment.id);
                totalRemindersSent++;

                logger.info('Payment reminder sent', {
                  paymentId: payment.id,
                  tenantId: tenant.id,
                  tenantEmail: tenant.email,
                  dueDate: payment.dueDate,
                  amount: payment.amount,
                  messageId: emailResult.messageId,
                });
              } else {
                logger.error('Failed to send payment reminder email', {
                  paymentId: payment.id,
                  tenantId: tenant.id,
                  tenantEmail: tenant.email,
                  error: emailResult.error,
                });
              }
            } catch (error) {
              logger.error('Failed to send payment reminder', {
                paymentId: payment.id,
                tenantId: tenant.id,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }

        results.push({
          organizationId: org.id,
          organizationName: orgName,
          success: true,
        });
      } catch (error) {
        logger.error('Failed to process reminders for organization', {
          organizationId: org.id,
          organizationName: orgName,
          error: error instanceof Error ? error.message : String(error),
        });

        results.push({
          organizationId: org.id,
          organizationName: orgName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('Payment reminder cron completed', {
      totalOrganizations: organizations.length,
      totalRemindersSent,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment reminders sent successfully',
      data: {
        totalOrganizations: organizations.length,
        totalRemindersSent,
        results,
      },
    });
  } catch (error) {
    logger.error('Payment reminder cron failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send payment reminders',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
