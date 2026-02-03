import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBillingHistory } from '@/lib/services/billing.service';
import { logger } from '@/lib/shared/logger';

/**
 * GET /api/billing/history
 * Returns paginated billing history for the authenticated user
 * Query params: page (default: 1), limit (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    // Get billing history
    const history = await getBillingHistory(userId, page, limit);

    logger.info('Billing history retrieved', {
      userId,
      page,
      limit,
      total: history.total,
    });

    return NextResponse.json(history);
  } catch (error) {
    logger.error('Failed to retrieve billing history', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: 'Failed to retrieve billing history' }, { status: 500 });
  }
}
