import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { listTransactionsQuerySchema, reconciliationService } from '@/lib/features/reconciliation';
import { handleApiError } from '@/lib/shared/errors';

import { requireReconciliationAccess } from './_shared';

/**
 * GET /api/reconciliation?status=SUGGESTED&importId=...
 * Status counts, bank lines (with suggested/confirmed invoice) and recent imports.
 */
export async function GET(request: NextRequest) {
  try {
    const { ownerId } = await requireReconciliationAccess();
    const query = listTransactionsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const overview = await reconciliationService.getOverview(
      ownerId,
      query.status === 'ALL' ? undefined : query.status,
      query.importId
    );

    return NextResponse.json({ success: true, data: overview });
  } catch (error) {
    return handleApiError(error);
  }
}
