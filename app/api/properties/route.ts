import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  description: z.string().optional(),
  propertyType: z.enum([
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
  ]),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  size: z.number().optional(),
  furnished: z.boolean().default(false),
  parkingSpaces: z.number().default(0),
  amenities: z.array(z.string()).optional(),
  rentalType: z.enum(['LONG_TERM', 'SHORT_TERM', 'BOTH']).default('LONG_TERM'),
  monthlyRent: z.number().optional(),
  dailyRate: z.number().optional(),
  weeklyRate: z.number().optional(),
  cleaningFee: z.number().optional(),
  securityDeposit: z.number().optional(),
  minimumStay: z.number().optional(),
  maximumStay: z.number().optional(),
  petsAllowed: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  houseRules: z.string().optional(),
});

// GET - List all properties for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const search = searchParams.get('search');

    // Handle multiple statuses (comma-separated)
    const statusFilter = statusParam ? statusParam.split(',').filter(Boolean) : undefined;

    // Handle multiple rental types (comma-separated)
    const typeFilter = typeParam ? typeParam.split(',').filter(Boolean) : undefined;

    const properties = await prisma.property.findMany({
      where: {
        userId: session.user.id,
        ...(statusFilter &&
          statusFilter.length > 0 && {
            status: {
              in: statusFilter as Array<
                'ACTIVE' | 'INACTIVE' | 'OCCUPIED' | 'MAINTENANCE' | 'ARCHIVED'
              >,
            },
          }),
        ...(typeFilter &&
          typeFilter.length > 0 && {
            rentalType: { in: typeFilter as Array<'LONG_TERM' | 'SHORT_TERM' | 'BOTH'> },
          }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            bookings: true,
            tenants: true,
          },
        },
      },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

// POST - Create a new property
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = propertySchema.parse(body);

    // Check property limit based on subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { propertyLimit: true },
    });

    const propertyCount = await prisma.property.count({
      where: { userId: session.user.id },
    });

    if (user && propertyCount >= user.propertyLimit) {
      return NextResponse.json(
        {
          error: `You have reached your property limit (${user.propertyLimit}). Please upgrade your plan.`,
        },
        { status: 403 }
      );
    }

    const property = await prisma.property.create({
      data: {
        userId: session.user.id,
        ...validatedData,
        amenities: validatedData.amenities || [],
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
