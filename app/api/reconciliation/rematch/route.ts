import { NextResponse } from 'next/server';

import { reconciliationService } from '@/lib/features/reconciliation';
import { handleApiError } from '@/lib/shared/errors';

import { requireReconciliationAccess } from '../_shared';

/** POST /api/reconciliation/rematch — re-run matching for unmatched lines. */
export async function POST() {
  try {
    const { ownerId } = await requireReconciliationAccess();
    const rematched = await reconciliationService.rematchUnmatched(ownerId);
    return NextResponse.json({ success: true, data: { rematched } });
  } catch (error) {
    return handleApiError(error);
  }
}
