import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { canAccessPlacementFeatures } from '@/lib/account-capabilities';
import {
  createRentalApplicationSchema,
  listRentalApplicationsSchema,
  rentalApplicationService,
} from '@/lib/features/placement';
import { NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';

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
    const filters = listRentalApplicationsSchema.parse({
      status: searchParams.get('status') || undefined,
      propertyId: searchParams.get('propertyId') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const result = await rentalApplicationService.list(userId, filters);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error fetching rental applications:', error);
    return NextResponse.json({ error: 'Failed to fetch rental applications' }, { status: 500 });
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
    const validatedData = createRentalApplicationSchema.parse(body);
    const application = await rentalApplicationService.createRentalApplication(
      userId,
      validatedData
    );

    return NextResponse.json(application, { status: 201 });
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

    console.error('Error creating rental application:', error);
    return NextResponse.json({ error: 'Failed to create rental application' }, { status: 500 });
  }
}
