import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  maintenanceService,
  updateMaintenanceSchema,
  maintenanceIdSchema,
} from '@/lib/features/maintenance';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

/**
 * GET /api/maintenance/[id] - Get a maintenance request by ID
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    maintenanceIdSchema.parse({ id });

    // Use service layer - handles ownership verification
    const maintenanceRequest = await maintenanceService.getById(id, session.user.id);

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error fetching maintenance request:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance request' }, { status: 500 });
  }
}

/**
 * PUT /api/maintenance/[id] - Update a maintenance request
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    maintenanceIdSchema.parse({ id });

    const body = await request.json();
    const validatedData = updateMaintenanceSchema.parse(body);

    // Use service layer - handles ownership verification and status change emails
    const maintenanceRequest = await maintenanceService.update(id, session.user.id, {
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      priority: validatedData.priority,
      status: validatedData.status,
      scheduledDate: validatedData.scheduledDate
        ? new Date(validatedData.scheduledDate)
        : undefined,
      completedDate: validatedData.completedDate
        ? new Date(validatedData.completedDate)
        : undefined,
      estimatedCost: validatedData.estimatedCost,
      actualCost: validatedData.actualCost,
      assignedTo: validatedData.assignedTo,
      resolutionNotes: validatedData.resolutionNotes,
    });

    return NextResponse.json(maintenanceRequest);
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

    console.error('Error updating maintenance request:', error);
    return NextResponse.json({ error: 'Failed to update maintenance request' }, { status: 500 });
  }
}

/**
 * DELETE /api/maintenance/[id] - Delete a maintenance request
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    maintenanceIdSchema.parse({ id });

    // Use service layer - handles ownership verification
    await maintenanceService.delete(id, session.user.id);

    return NextResponse.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error deleting maintenance request:', error);
    return NextResponse.json({ error: 'Failed to delete maintenance request' }, { status: 500 });
  }
}
