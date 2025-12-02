import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { automationService } from '@/lib/features/messaging';
import { updateAutomationSchema } from '@/lib/features/messaging';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const automation = await automationService.getById(session.user.organizationId, id);
    return NextResponse.json(automation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Validate
    const validatedData = updateAutomationSchema.parse(body);

    // Update
    const automation = await automationService.update(
      session.user.organizationId,
      id,
      validatedData
    );

    // Audit
    await logAudit(session, 'updated', 'automation', id, undefined, request);

    return NextResponse.json(automation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await automationService.delete(session.user.organizationId, id);

    // Audit
    await logAudit(session, 'deleted', 'automation', id, undefined, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
