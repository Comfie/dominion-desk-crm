import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { messageSchedulerService } from '@/lib/features/messaging';

/**
 * Cron job endpoint - process pending scheduled messages
 * Should be called every 10-15 minutes via Vercel Cron or similar
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await messageSchedulerService.processPending();

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
