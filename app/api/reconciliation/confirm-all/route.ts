import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { confirmAllSchema, reconciliationService } from '@/lib/features/reconciliation';
import { logAudit } from '@/lib/shared/audit';
import { handleApiError } from '@/lib/shared/errors';

import { requireReconciliationAccess } from '../_shared';

export const maxDuration = 60;

/**
 * POST /api/reconciliation/confirm-all
 * Body: { minConfidence?: number } (default 80)
 * Confirms every suggestion at or above the confidence bar.
 */
export async function POST(request: NextRequest) {
  try {
    const { session, ownerId, actorId } = await requireReconciliationAccess();
    const body = await request.json().catch(() => ({}));
    const dto = confirmAllSchema.parse(body);

    const result = await reconciliationService.confirmAll(ownerId, actorId, dto.minConfidence);

    await logAudit(session, 'updated', 'bank_transaction', 'bulk', { ...dto, ...result }, request);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
