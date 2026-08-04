import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { canAccessPlacementFeatures } from '@/lib/account-capabilities';
import { authOptions } from '@/lib/auth';
import { screeningService, updateApplicantScreeningSchema } from '@/lib/features/placement';
import { NotFoundError } from '@/lib/shared/errors/app-error';

function getPlacementUserId(session: Session | null) {
  if (!session?.user?.id || !canAccessPlacementFeatures(session.user.accountType)) {
    return null;
  }

  return session.user.organizationId || session.user.id;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getPlacementUserId(session);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Placement features are only available to agencies' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateApplicantScreeningSchema.parse(body);
    const screening = await screeningService.updateScreening(userId, id, validatedData);

    return NextResponse.json(screening);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('Error updating applicant screening:', error);
    return NextResponse.json({ error: 'Failed to update applicant screening' }, { status: 500 });
  }
}
