import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { tenantService, updateTenantSchema, tenantIdSchema } from '@/lib/features/tenants';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';
import { prisma } from '@/lib/db';

/**
 * GET /api/tenants/[id] - Get tenant details with related data
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { id: tenantId } = tenantIdSchema.parse({ id });

    // For GET, we need more detailed data than the service provides
    // So we query directly but still verify ownership
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        userId: session.user.id,
      },
      include: {
        properties: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                primaryImageUrl: true,
              },
            },
          },
          orderBy: { leaseStartDate: 'desc' },
        },
        bookings: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { checkInDate: 'desc' },
          take: 10,
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 10,
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching tenant:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 });
  }
}

/**
 * PUT /api/tenants/[id] - Update tenant details
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { id: tenantId } = tenantIdSchema.parse({ id });

    const body = await request.json();
    const validatedData = updateTenantSchema.parse(body);

    const tenant = await tenantService.update(tenantId, session.user.id, validatedData);

    return NextResponse.json(tenant);
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

    console.error('Error updating tenant:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}

/**
 * DELETE /api/tenants/[id] - Delete a tenant
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { id: tenantId } = tenantIdSchema.parse({ id });

    await tenantService.delete(tenantId, session.user.id);

    return NextResponse.json({ message: 'Tenant deleted successfully' });
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

    console.error('Error deleting tenant:', error);
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 });
  }
}
