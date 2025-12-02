import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { automationService } from '@/lib/features/messaging';
import { createAutomationSchema } from '@/lib/features/messaging';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const automations = await automationService.getAll(session.user.organizationId);
    return NextResponse.json(automations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = createAutomationSchema.parse(body);

    // Create automation
    const automation = await automationService.create(session.user.organizationId, validatedData);

    // Audit log
    await logAudit(session, 'created', 'automation', automation.id, undefined, request);

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
