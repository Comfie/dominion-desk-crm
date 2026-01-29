import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const querySchema = z.object({
  propertyId: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  type: z
    .enum(['MOVE_IN', 'MOVE_OUT', 'ROUTINE', 'MAINTENANCE', 'ANNUAL', 'PRE_PURCHASE'])
    .optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

const createInspectionSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  tenantId: z.string().optional().nullable(),
  inspectionType: z.enum([
    'MOVE_IN',
    'MOVE_OUT',
    'ROUTINE',
    'MAINTENANCE',
    'ANNUAL',
    'PRE_PURCHASE',
  ]),
  scheduledDate: z.string().transform((str) => new Date(str)),
  inspector: z.string().optional(),
  overallNotes: z.string().optional(),
});

// GET - List all inspections
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      propertyId: searchParams.get('propertyId') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
    });

    const skip = (query.page - 1) * query.limit;

    const where = {
      userId: session.user.id,
      ...(query.propertyId && { propertyId: query.propertyId }),
      ...(query.status && { status: query.status }),
      ...(query.type && { inspectionType: query.type }),
    };

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true, address: true },
          },
          tenant: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.inspection.count({ where }),
    ]);

    return NextResponse.json({
      data: inspections,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 });
  }
}

// POST - Create a new inspection
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createInspectionSchema.parse(body);

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: validatedData.propertyId,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Verify tenant if provided
    if (validatedData.tenantId) {
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: validatedData.tenantId,
          userId: session.user.id,
        },
      });

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
    }

    const inspection = await prisma.inspection.create({
      data: {
        userId: session.user.id,
        propertyId: validatedData.propertyId,
        tenantId: validatedData.tenantId,
        inspectionType: validatedData.inspectionType,
        scheduledDate: validatedData.scheduledDate,
        inspector: validatedData.inspector,
        overallNotes: validatedData.overallNotes,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error creating inspection:', error);
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 });
  }
}
