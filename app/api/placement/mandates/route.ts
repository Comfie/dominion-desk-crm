import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { canAccessPlacementFeatures } from '@/lib/account-capabilities';
import { authOptions } from '@/lib/auth';
import {
  createRentalMandateSchema,
  listRentalMandatesSchema,
  mandateService,
} from '@/lib/features/placement';
import { NotFoundError } from '@/lib/shared/errors/app-error';

function getPlacementUserId(session: Session | null) {
  if (!session?.user?.id || !canAccessPlacementFeatures(session.user.accountType)) {
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
    const filters = listRentalMandatesSchema.parse({
      status: searchParams.get('status') || undefined,
      propertyId: searchParams.get('propertyId') || undefined,
      landlordOwnerId: searchParams.get('landlordOwnerId') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const result = await mandateService.listRentalMandates(userId, filters);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error fetching mandates:', error);
    return NextResponse.json({ error: 'Failed to fetch mandates' }, { status: 500 });
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
    const validatedData = createRentalMandateSchema.parse(body);
    const mandate = await mandateService.createRentalMandate(userId, validatedData);

    return NextResponse.json(mandate, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('Error creating mandate:', error);
    return NextResponse.json({ error: 'Failed to create mandate' }, { status: 500 });
  }
}
