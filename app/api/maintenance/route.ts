import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  maintenanceService,
  createMaintenanceSchema,
  listMaintenanceSchema,
} from '@/lib/features/maintenance';
import { notifyMaintenanceRequest } from '@/lib/notifications';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

/**
 * GET /api/maintenance - List maintenance requests
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Parse and validate filters
    const filters = listMaintenanceSchema.parse({
      propertyId: searchParams.get('propertyId') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
    });

    // Use service layer
    const maintenanceRequests = await maintenanceService.list(session.user.id, filters);

    // Apply pagination
    const total = maintenanceRequests.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = maintenanceRequests.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance requests' }, { status: 500 });
  }
}

/**
 * POST /api/maintenance - Create a maintenance request
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMaintenanceSchema.parse(body);

    // Use service layer - handles property/tenant verification
    const maintenanceRequest = await maintenanceService.create(session.user.id, {
      propertyId: validatedData.propertyId,
      tenantId: validatedData.tenantId,
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      priority: validatedData.priority,
      scheduledDate: validatedData.scheduledDate,
      estimatedCost: validatedData.estimatedCost,
    });

    // Create notification
    try {
      if (maintenanceRequest.property) {
        await notifyMaintenanceRequest(
          session.user.id,
          validatedData.title,
          maintenanceRequest.property.name,
          maintenanceRequest.id
        );
      }
    } catch (notifyError) {
      console.error('Failed to create notification:', notifyError);
    }

    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error creating maintenance request:', error);
    return NextResponse.json({ error: 'Failed to create maintenance request' }, { status: 500 });
  }
}
