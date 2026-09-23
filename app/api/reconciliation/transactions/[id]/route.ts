import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { reconciliationService, transactionActionSchema } from '@/lib/features/reconciliation';
import { logAudit } from '@/lib/shared/audit';
import { handleApiError } from '@/lib/shared/errors';

import { requireReconciliationAccess } from '../../_shared';

/**
 * POST /api/reconciliation/transactions/:id
 * Body: { action: 'confirm', paymentId? } | { action: 'reject' | 'ignore' | 'restore' | 'unmatch' }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, ownerId, actorId } = await requireReconciliationAccess();
    const { id } = await params;
    const dto = transactionActionSchema.parse(await request.json());

    let result: unknown;
    switch (dto.action) {
      case 'confirm':
        result = await reconciliationService.confirm(ownerId, actorId, id, dto.paymentId);
        break;
      case 'unmatch':
        result = await reconciliationService.unmatch(ownerId, actorId, id);
        break;
      default:
        result = await reconciliationService.setStatus(ownerId, id, dto.action);
    }

    await logAudit(
      session,
      'updated',
      'bank_transaction',
      id,
      { action: dto.action, result },
      request
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
