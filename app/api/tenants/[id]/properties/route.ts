import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

const assignPropertySchema = z
  .object({
    propertyId: z.string().min(1, 'Property is required'),
    leaseStartDate: z.string().min(1, 'Lease start date is required'),
    leaseEndDate: z.string().min(1, 'Lease end date is required'),
    monthlyRent: z.number().min(0, 'Monthly rent must be a positive number'),
    depositPaid: z.number().min(0, 'Deposit must be a positive number').optional().default(0),
    moveInDate: z.string().optional().nullable(),
    leaseDocumentUrl: z.string().optional().nullable(),
    unitLabel: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.leaseStartDate);
      const endDate = new Date(data.leaseEndDate);
      return endDate > startDate;
    },
    {
      message: 'Lease end date must be after lease start date',
      path: ['leaseEndDate'],
    }
  );

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify tenant belongs to user
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get all property assignments for this tenant
    // SECURITY: Filter by userId to ensure user can only see their own properties
    const propertyAssignments = await prisma.propertyTenant.findMany({
      where: {
        tenantId: id,
        property: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        leaseStartDate: true,
        leaseEndDate: true,
        monthlyRent: true,
        depositPaid: true,
        moveInDate: true,
        moveOutDate: true,
        isActive: true,
        unitLabel: true,
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            province: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            isAvailable: true,
          },
        },
      },
      orderBy: {
        leaseStartDate: 'desc',
      },
    });

    return NextResponse.json(propertyAssignments);
  } catch (error) {
    console.error('Error fetching property assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch property assignments' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify tenant belongs to user
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = assignPropertySchema.parse(body);

    // Verify property belongs to user and check multi-tenant support
    const property = await prisma.property.findFirst({
      where: {
        id: validatedData.propertyId,
        userId: session.user.id,
      },
      include: {
        tenants: {
          where: { isActive: true },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check if property allows multiple tenants
    if (!property.allowsMultipleTenants && property.tenants.length > 0) {
      return NextResponse.json(
        {
          error:
            'This property does not allow multiple tenants and already has an active tenant assigned. Enable "Allows Multiple Tenants" in property settings to add more tenants.',
        },
        { status: 400 }
      );
    }

    // Check for duplicate: same tenant, same property, same unit, still active
    const existingAssignment = await prisma.propertyTenant.findFirst({
      where: {
        propertyId: validatedData.propertyId,
        tenantId: id,
        unitLabel: validatedData.unitLabel || null,
        isActive: true,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'This tenant already has an active lease for this property/unit' },
        { status: 400 }
      );
    }

    // Check for overlapping bookings
    const leaseStart = new Date(validatedData.leaseStartDate);
    const leaseEnd = new Date(validatedData.leaseEndDate);

    const overlappingBookings = await prisma.booking.findMany({
      where: {
        propertyId: validatedData.propertyId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
        },
        OR: [
          {
            // Booking starts during the lease period
            checkInDate: {
              gte: leaseStart,
              ...(leaseEnd && { lte: leaseEnd }),
            },
          },
          {
            // Booking ends during the lease period
            checkOutDate: {
              gte: leaseStart,
              ...(leaseEnd && { lte: leaseEnd }),
            },
          },
          {
            // Lease period falls within booking period
            AND: [
              { checkInDate: { lte: leaseStart } },
              { checkOutDate: leaseEnd ? { gte: leaseEnd } : { gte: leaseStart } },
            ],
          },
        ],
      },
    });

    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        {
          error: 'Property has overlapping bookings during the lease period',
          bookings: overlappingBookings.map((b) => ({
            id: b.id,
            checkIn: b.checkInDate,
            checkOut: b.checkOutDate,
            guest: b.guestName,
          })),
        },
        { status: 400 }
      );
    }

    // Create property-tenant assignment
    const assignment = await prisma.propertyTenant.create({
      data: {
        userId: session.user.id,
        propertyId: validatedData.propertyId,
        tenantId: id,
        leaseStartDate: new Date(validatedData.leaseStartDate),
        leaseEndDate: new Date(validatedData.leaseEndDate),
        monthlyRent: new Prisma.Decimal(validatedData.monthlyRent),
        depositPaid: new Prisma.Decimal(validatedData.depositPaid),
        moveInDate: validatedData.moveInDate ? new Date(validatedData.moveInDate) : null,
        leaseDocumentUrl: validatedData.leaseDocumentUrl,
        unitLabel: validatedData.unitLabel || null,
        isActive: true,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            province: true,
          },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error assigning property:', error);
    return NextResponse.json({ error: 'Failed to assign property' }, { status: 500 });
  }
}
