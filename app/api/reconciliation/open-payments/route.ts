import { NextResponse } from 'next/server';

import { reconciliationService } from '@/lib/features/reconciliation';
import { handleApiError } from '@/lib/shared/errors';

import { requireReconciliationAccess } from '../_shared';

/** GET /api/reconciliation/open-payments — invoices that can still receive money. */
export async function GET() {
  try {
    const { ownerId } = await requireReconciliationAccess();
    const payments = await reconciliationService.getOpenPayments(ownerId);
    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    return handleApiError(error);
  }
}
