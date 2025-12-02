import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { scheduledMessageRepository } from '@/lib/features/messaging/repositories/scheduled-message.repository';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const messages = await scheduledMessageRepository.findByUser(session.user.organizationId);
    return NextResponse.json(messages);
  } catch (error) {
    return handleApiError(error);
  }
}
