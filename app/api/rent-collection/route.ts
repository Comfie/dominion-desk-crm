import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/lib/features/payments/services/payment.service';
import { PaymentStatus } from '@prisma/client';
import { logger } from '@/lib/shared/logger';
import { handleApiError } from '@/lib/shared/errors';

/**
 * GET /api/rent-collection
 * Retrieve rent collection grid data for a specific month
 *
 * Query params:
 * - month: number (1-12)
 * - year: number
 * - propertyId: string (optional, defaults to 'all')
 * - status: PaymentStatus (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams;

    // Parse and validate query parameters
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    const propertyId = searchParams.get('propertyId') || 'all';
    const statusParam = searchParams.get('status');

    // Default to current month if not provided
    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    // Validate month and year
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month. Must be between 1 and 12.' },
        { status: 400 }
      );
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid year. Must be between 2000 and 2100.' },
        { status: 400 }
      );
    }

    // Validate status if provided
    let status: PaymentStatus | undefined;
    if (statusParam && statusParam !== 'all') {
      if (!Object.values(PaymentStatus).includes(statusParam as PaymentStatus)) {
        return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
      }
      status = statusParam as PaymentStatus;
    }

    // Get rent collection data
    const data = await paymentService.getRentCollectionData(userId, month, year, {
      propertyId,
      status,
    });

    logger.info('Rent collection data retrieved', {
      userId,
      month,
      year,
      propertyId,
      status,
      propertiesCount: data.properties.length,
    });

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
