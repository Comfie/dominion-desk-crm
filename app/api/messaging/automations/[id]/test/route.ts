import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { automationService } from '@/lib/features/messaging';
import { testAutomationSchema } from '@/lib/features/messaging';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const validatedData = testAutomationSchema.parse(body);

    const result = await automationService.testAutomation(
      session.user.organizationId,
      id,
      validatedData
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
