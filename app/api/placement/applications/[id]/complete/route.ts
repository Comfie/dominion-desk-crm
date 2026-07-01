import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { canAccessPlacementFeatures } from '@/lib/account-capabilities';
import { authOptions } from '@/lib/auth';
import { completePlacementSchema, placementCompletionService } from '@/lib/features/placement';
import { NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';

function getPlacementUserId(session: Session | null) {
  if (!session?.user?.id || !canAccessPlacementFeatures(session.user.accountType)) {
    return null;
  }

  return session.user.organizationId || session.user.id;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getPlacementUserId(session);
    if (!userId) {
      return NextResponse.json(
        { error: 'Placement features are only available to agencies' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const data = completePlacementSchema.parse(await request.json());
    const result = await placementCompletionService.completePlacement(userId, id, data);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('Error completing rental placement:', error);
    return NextResponse.json({ error: 'Failed to complete rental placement' }, { status: 500 });
  }
}
