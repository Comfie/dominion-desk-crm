import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { automationService } from '@/lib/features/messaging';
import { z } from 'zod';

const toggleSchema = z.object({
  isActive: z.boolean(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { isActive } = toggleSchema.parse(body);

    const automation = await automationService.toggle(session.user.organizationId, id, isActive);

    await logAudit(session, 'updated', 'automation', id, { after: { isActive } }, request);

    return NextResponse.json(automation);
  } catch (error) {
    return handleApiError(error);
  }
}
