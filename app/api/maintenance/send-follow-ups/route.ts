import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { maintenanceService } from '@/lib/features/maintenance/services/maintenance.service';
import { logger } from '@/lib/shared/logger';

/**
 * Cron job endpoint to send follow-up emails for stale maintenance requests
 * Runs daily at 10 AM (configured in vercel.json)
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('Unauthorized cron job access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting maintenance follow-up emails cron job');

    const result = await maintenanceService.sendFollowUpEmails();

    logger.info('Maintenance follow-up emails cron job completed', result);

    return NextResponse.json({
      success: true,
      message: 'Follow-up emails processed',
      ...result,
    });
  } catch (error) {
    logger.error('Error in maintenance follow-up emails cron job', { error });
    return NextResponse.json(
      {
        error: 'Failed to process follow-up emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
