import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const updatePropertySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  propertyType: z
    .enum([
      'APARTMENT',
      'HOUSE',
      'TOWNHOUSE',
      'COTTAGE',
      'ROOM',
      'STUDIO',
      'DUPLEX',
      'PENTHOUSE',
      'VILLA',
      'OTHER',
    ])
    .optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  size: z.number().nullable().optional(),
  furnished: z.boolean().optional(),
  parkingSpaces: z.number().optional(),
  amenities: z.array(z.string()).nullable().optional(),
  rentalType: z.enum(['LONG_TERM', 'SHORT_TERM', 'BOTH']).optional(),
  monthlyRent: z.number().nullable().optional(),
  dailyRate: z.number().nullable().optional(),
  weeklyRate: z.number().nullable().optional(),
  monthlyRate: z.number().nullable().optional(),
  cleaningFee: z.number().nullable().optional(),
  securityDeposit: z.number().nullable().optional(),
  minimumStay: z.number().nullable().optional(),
  maximumStay: z.number().nullable().optional(),
  petsAllowed: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
  checkInTime: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  houseRules: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OCCUPIED', 'MAINTENANCE', 'ARCHIVED']).optional(),
  isAvailable: z.boolean().optional(),
  primaryImageUrl: z.string().nullable().optional(),
});

// GET - Get a single property
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const property = await prisma.property.findFirst({
      where: {
        id,
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
    console.error('Error fetching property:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}

// PUT - Update a property
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePropertySchema.parse(body);

    // Check if property exists and belongs to user
    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Transform null values for JSON fields
    const updateData = {
      ...validatedData,
      amenities: validatedData.amenities === null ? Prisma.JsonNull : validatedData.amenities,
    };

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(property);
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error updating property:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update property';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Delete a property
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if property exists and belongs to user
    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
