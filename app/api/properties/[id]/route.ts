import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { propertyService, updatePropertySchema, propertyIdSchema } from '@/lib/features/properties';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

/**
 * GET /api/properties/[id] - Get a single property with related data
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { id: propertyId } = propertyIdSchema.parse({ id });

    // Use direct query for rich includes (bookings, tenants, expenses, etc.)
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.user.id,
      },
      include: {
        bookings: {
          take: 5,
          orderBy: { checkInDate: 'desc' },
        },
        tenants: {
          include: {
            tenant: true,
          },
        },
        maintenanceRequests: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        expenses: {
          take: 10,
          orderBy: { expenseDate: 'desc' },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
            expenses: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching property:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}

/**
 * PUT /api/properties/[id] - Update a property
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { id: propertyId } = propertyIdSchema.parse({ id });

    const body = await request.json();
    const validatedData = updatePropertySchema.parse(body);

    const property = await propertyService.update(propertyId, session.user.id, validatedData);

    return NextResponse.json(property);
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

    console.error('Error updating property:', error);
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

/**
 * DELETE /api/properties/[id] - Delete a property
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { id: propertyId } = propertyIdSchema.parse({ id });

    await propertyService.delete(propertyId, session.user.id);

    return NextResponse.json({ message: 'Property deleted successfully' });
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

    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
