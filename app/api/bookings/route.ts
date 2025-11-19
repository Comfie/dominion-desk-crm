import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

const bookingSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  guestName: z.string().min(1, 'Guest name is required'),
  guestEmail: z.string().email('Invalid email').optional().nullable(),
  guestPhone: z.string().optional().nullable(),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  numberOfGuests: z.number().min(1, 'At least 1 guest required').default(1),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'])
    .default('PENDING'),
  source: z.enum(['DIRECT', 'AIRBNB', 'BOOKING_COM', 'VRBO', 'OTHER']).default('DIRECT'),
  notes: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      property: {
        ownerId: session.user.id,
      },
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (startDate || endDate) {
      where.checkInDate = {};
      if (startDate) {
        (where.checkInDate as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.checkInDate as Record<string, Date>).lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { guestPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
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
      orderBy: { checkInDate: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: validatedData.propertyId,
        ownerId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check for overlapping bookings
    const overlapping = await prisma.booking.findFirst({
      where: {
        propertyId: validatedData.propertyId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            AND: [
              { checkInDate: { lte: new Date(validatedData.checkInDate) } },
              { checkOutDate: { gt: new Date(validatedData.checkInDate) } },
            ],
          },
          {
            AND: [
              { checkInDate: { lt: new Date(validatedData.checkOutDate) } },
              { checkOutDate: { gte: new Date(validatedData.checkOutDate) } },
            ],
          },
          {
            AND: [
              { checkInDate: { gte: new Date(validatedData.checkInDate) } },
              { checkOutDate: { lte: new Date(validatedData.checkOutDate) } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: 'This property already has a booking for the selected dates' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId: validatedData.propertyId,
        guestName: validatedData.guestName,
        guestEmail: validatedData.guestEmail,
        guestPhone: validatedData.guestPhone,
        checkInDate: new Date(validatedData.checkInDate),
        checkOutDate: new Date(validatedData.checkOutDate),
        numberOfGuests: validatedData.numberOfGuests,
        totalAmount: validatedData.totalAmount,
        status: validatedData.status,
        source: validatedData.source,
        notes: validatedData.notes,
        specialRequests: validatedData.specialRequests,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
