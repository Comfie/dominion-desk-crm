import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { notifyMaintenanceRequest } from '@/lib/notifications';

const maintenanceSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  tenantId: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum([
    'PLUMBING',
    'ELECTRICAL',
    'HVAC',
    'APPLIANCE',
    'STRUCTURAL',
    'PAINTING',
    'CLEANING',
    'LANDSCAPING',
    'PEST_CONTROL',
    'SECURITY',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  location: z.string().optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const propertyId = searchParams.get('propertyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [maintenanceRequests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: maintenanceRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = maintenanceSchema.parse(body);

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

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        userId: session.user.id,
        propertyId: validatedData.propertyId,
        tenantId: validatedData.tenantId,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        priority: validatedData.priority,
        location: validatedData.location,
        scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : null,
        estimatedCost: validatedData.estimatedCost,
        assignedTo: validatedData.assignedTo,
        status: 'PENDING',
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create notification for new maintenance request
    try {
      await notifyMaintenanceRequest(
        session.user.id,
        validatedData.title,
        property.name,
        maintenanceRequest.id
      );
    } catch (notifyError) {
      console.error('Failed to create notification:', notifyError);
    }

    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error creating maintenance request:', error);
    return NextResponse.json({ error: 'Failed to create maintenance request' }, { status: 500 });
  }
}
