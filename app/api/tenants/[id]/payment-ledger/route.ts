import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentRepository } from '@/lib/features/payments/repositories/payment.repository';
import { logger } from '@/lib/shared/logger';
import { handleApiError } from '@/lib/shared/errors';

/**
 * GET /api/tenants/[id]/payment-ledger
 * Retrieve complete payment history for a tenant
 *
 * Query params:
 * - year: number (optional, filters to specific year)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const tenantId = params.id;
    const searchParams = req.nextUrl.searchParams;

    // Parse year filter if provided
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    if (yearParam && (isNaN(year!) || year! < 2000 || year! > 2100)) {
      return NextResponse.json(
        { error: 'Invalid year. Must be between 2000 and 2100.' },
        { status: 400 }
      );
    }

    // Get tenant payment ledger
    const ledger = await paymentRepository.getTenantPaymentLedger(tenantId, userId, year);

    logger.info('Tenant payment ledger retrieved', {
      userId,
      tenantId,
      year,
      paymentsCount: ledger.payments.length,
    });

    return NextResponse.json(ledger);
  } catch (error) {
    return handleApiError(error);
  }
}
