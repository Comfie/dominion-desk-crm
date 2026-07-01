import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { canAccessPlacementFeatures } from '@/lib/account-capabilities';
import { authOptions } from '@/lib/auth';
import { createViewingSchema, listViewingsSchema, viewingService } from '@/lib/features/placement';
import { AvailabilityError, NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';

function getPlacementUserId(session: Session | null) {
  if (!session?.user?.id) {
    return null;
  }

  if (!canAccessPlacementFeatures(session.user.accountType)) {
    return null;
  }

  return session.user.organizationId || session.user.id;
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const filters = listViewingsSchema.parse({
      status: searchParams.get('status') || undefined,
      propertyId: searchParams.get('propertyId') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const result = await viewingService.list(userId, filters);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error fetching viewings:', error);
    return NextResponse.json({ error: 'Failed to fetch viewings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const validatedData = createViewingSchema.parse(body);
    const viewing = await viewingService.createViewing(userId, validatedData);

    return NextResponse.json(viewing, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof AvailabilityError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('Error creating viewing:', error);
    return NextResponse.json({ error: 'Failed to create viewing' }, { status: 500 });
  }
}
