import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paymentService } from '@/lib/features/payments/services/payment.service';
import { logger } from '@/lib/shared/logger';

/**
 * POST /api/payments/generate-monthly
 * Cron job to generate monthly rent payments for all organizations
 * Runs on the 25th of each month at midnight
 * Schedule: 0 0 25 * *
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('Unauthorized cron job access attempt', {
        path: '/api/payments/generate-monthly',
        authHeader: authHeader ? '[REDACTED]' : 'missing',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const nextMonth = now.getMonth() + 2; // +1 for 0-indexed month, +1 for next month
    const nextYear = nextMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
    const targetMonth = nextMonth > 12 ? 1 : nextMonth;

    logger.info('Starting monthly payment generation cron', {
      month: targetMonth,
      year: nextYear,
    });

    // Get all organizations (users who have tenants)
    const organizations = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        tenants: {
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

    let totalPaymentsGenerated = 0;
    const results: Array<{
      organizationId: string;
      organizationName: string;
      paymentsGenerated: number;
      success: boolean;
      error?: string;
    }> = [];

    for (const org of organizations) {
      const orgName = org.companyName || `${org.firstName} ${org.lastName}`;

      try {
        const result = await paymentService.generateMonthlyPayments(org.id, targetMonth, nextYear);

        totalPaymentsGenerated += result.count;
        results.push({
          organizationId: org.id,
          organizationName: orgName,
          paymentsGenerated: result.count,
          success: true,
        });

        logger.info('Monthly payments generated for organization', {
          organizationId: org.id,
          organizationName: orgName,
          paymentsGenerated: result.count,
          month: targetMonth,
          year: nextYear,
        });
      } catch (error) {
        logger.error('Failed to generate monthly payments for organization', {
          organizationId: org.id,
          organizationName: orgName,
          error: error instanceof Error ? error.message : String(error),
        });

        results.push({
          organizationId: org.id,
          organizationName: orgName,
          paymentsGenerated: 0,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('Monthly payment generation cron completed', {
      totalOrganizations: organizations.length,
      totalPaymentsGenerated,
      month: targetMonth,
      year: nextYear,
    });

    return NextResponse.json({
      success: true,
      message: 'Monthly payments generated successfully',
      data: {
        month: targetMonth,
        year: nextYear,
        totalOrganizations: organizations.length,
        totalPaymentsGenerated,
        results,
      },
    });
  } catch (error) {
    logger.error('Monthly payment generation cron failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate monthly payments',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
