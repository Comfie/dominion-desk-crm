import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { importStatementSchema, reconciliationService } from '@/lib/features/reconciliation';
import { logAudit } from '@/lib/shared/audit';
import { handleApiError } from '@/lib/shared/errors';

import { requireReconciliationAccess } from '../_shared';

export const maxDuration = 60;

/**
 * POST /api/reconciliation/import
 * Body: { fileName, content (CSV text), mapping? }
 * Parses the statement, stores new credit lines and suggests invoice matches.
 * On unrecognised columns returns 400 with error.details.code = MAPPING_REQUIRED.
 */
export async function POST(request: NextRequest) {
  try {
    const { session, ownerId, actorId } = await requireReconciliationAccess();
    const dto = importStatementSchema.parse(await request.json());

    const result = await reconciliationService.importStatement(ownerId, actorId, dto);

    await logAudit(
      session,
      'imported',
      'bank_statement',
      result.import.id,
      { fileName: dto.fileName, ...result.summary },
      request
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
