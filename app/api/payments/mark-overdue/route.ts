import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paymentService } from '@/lib/features/payments/services/payment.service';
import { logger } from '@/lib/shared/logger';

/**
 * POST /api/payments/mark-overdue
 * Cron job to mark pending payments as overdue when past due date
 * Runs daily at midnight
 * Schedule: 0 0 * * *
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('Unauthorized cron job access attempt', {
        path: '/api/payments/mark-overdue',
        authHeader: authHeader ? '[REDACTED]' : 'missing',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting mark overdue payments cron');

    // Get all organizations (users who have payments)
    const organizations = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        payments: {
          some: {},
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
    });

    let totalMarkedOverdue = 0;
    const results: Array<{
      organizationId: string;
      organizationName: string;
      paymentsMarkedOverdue: number;
      success: boolean;
      error?: string;
    }> = [];

    for (const org of organizations) {
      const orgName = org.companyName || `${org.firstName} ${org.lastName}`;

      try {
        // Find overdue payments for this organization
        const overduePayments = await paymentService.findOverduePayments(org.id);

        for (const payment of overduePayments) {
          try {
            await paymentService.markAsOverdue(payment.id);
            totalMarkedOverdue++;

            logger.info('Payment marked as overdue', {
              paymentId: payment.id,
              organizationId: org.id,
              tenantId: payment.tenantId,
              dueDate: payment.dueDate,
              amount: payment.amount,
            });
          } catch (error) {
            logger.error('Failed to mark payment as overdue', {
              paymentId: payment.id,
              organizationId: org.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        results.push({
          organizationId: org.id,
          organizationName: orgName,
          paymentsMarkedOverdue: overduePayments.length,
          success: true,
        });

        logger.info('Processed overdue payments for organization', {
          organizationId: org.id,
          organizationName: orgName,
          paymentsMarkedOverdue: overduePayments.length,
        });
      } catch (error) {
        logger.error('Failed to process overdue payments for organization', {
          organizationId: org.id,
          organizationName: orgName,
          error: error instanceof Error ? error.message : String(error),
        });

        results.push({
          organizationId: org.id,
          organizationName: orgName,
          paymentsMarkedOverdue: 0,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('Mark overdue payments cron completed', {
      totalOrganizations: organizations.length,
      totalMarkedOverdue,
    });

    return NextResponse.json({
      success: true,
      message: 'Overdue payments marked successfully',
      data: {
        totalOrganizations: organizations.length,
        totalMarkedOverdue,
        results,
      },
    });
  } catch (error) {
    logger.error('Mark overdue payments cron failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark overdue payments',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
