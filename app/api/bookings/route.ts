import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { randomUUID } from 'crypto';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { notifyNewBooking } from '@/lib/notifications';

const bookingSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  guestName: z.string().min(1, 'Guest name is required'),
  guestEmail: z.string().email('Invalid email'),
  guestPhone: z.string().min(1, 'Phone is required'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  numberOfGuests: z.number().min(1, 'At least 1 guest required').default(1),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'])
    .default('PENDING'),
  bookingSource: z
    .enum(['DIRECT', 'AIRBNB', 'BOOKING_COM', 'WEBSITE', 'REFERRAL', 'OTHER'])
    .default('DIRECT'),
  internalNotes: z.string().optional().nullable(),
  guestNotes: z.string().optional().nullable(),
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
      userId: session.user.id,
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.bookingSource = source;
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

    // Transform for frontend compatibility
    const transformedBookings = bookings.map((booking: (typeof bookings)[number]) => ({
      ...booking,
      source: booking.bookingSource,
      notes: booking.internalNotes,
      specialRequests: booking.guestNotes,
    }));

    return NextResponse.json(transformedBookings);
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

    // Transform frontend field names to schema field names
    const transformedBody = {
      ...body,
      bookingSource: body.source || body.bookingSource || 'DIRECT',
      internalNotes: body.notes || body.internalNotes || null,
      guestNotes: body.specialRequests || body.guestNotes || null,
      guestEmail: body.guestEmail || '',
      guestPhone: body.guestPhone || '',
    };

    const validatedData = bookingSchema.parse(transformedBody);

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

    // Calculate number of nights
    const checkIn = new Date(validatedData.checkInDate);
    const checkOut = new Date(validatedData.checkOutDate);
    const numberOfNights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Generate booking reference
    const bookingReference = `BK-${randomUUID().substring(0, 8).toUpperCase()}`;

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        propertyId: validatedData.propertyId,
        bookingReference,
        bookingType: 'SHORT_TERM',
        guestName: validatedData.guestName,
        guestEmail: validatedData.guestEmail,
        guestPhone: validatedData.guestPhone,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfNights,
        numberOfGuests: validatedData.numberOfGuests,
        baseRate: validatedData.totalAmount / numberOfNights,
        totalAmount: validatedData.totalAmount,
        amountDue: validatedData.totalAmount,
        status: validatedData.status,
        bookingSource: validatedData.bookingSource,
        guestNotes: validatedData.guestNotes,
        internalNotes: validatedData.internalNotes,
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

    // Transform for frontend compatibility
    const transformedBooking = {
      ...booking,
      source: booking.bookingSource,
      notes: booking.internalNotes,
      specialRequests: booking.guestNotes,
    };

    // Create notification for new booking
    try {
      await notifyNewBooking(session.user.id, validatedData.guestName, property.name, booking.id);
    } catch (notifyError) {
      console.error('Failed to create notification:', notifyError);
      // Don't fail the booking creation if notification fails
    }

    return NextResponse.json(transformedBooking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
