import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { scheduledMessageRepository } from '@/lib/features/messaging/repositories/scheduled-message.repository';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const message = await scheduledMessageRepository.findById(id, session.user.organizationId);

    if (!message) {
      return NextResponse.json({ error: 'Scheduled message not found' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await scheduledMessageRepository.cancel(id, session.user.organizationId);

    // Audit
    await logAudit(session, 'deleted', 'message', id, undefined, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
