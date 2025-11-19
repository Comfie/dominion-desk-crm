import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

const updateBookingSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required').optional(),
  guestEmail: z.string().email('Invalid email').optional().nullable(),
  guestPhone: z.string().optional().nullable(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  numberOfGuests: z.number().min(1).optional(),
  totalAmount: z.number().min(0).optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'])
    .optional(),
  source: z.enum(['DIRECT', 'AIRBNB', 'BOOKING_COM', 'VRBO', 'OTHER']).optional(),
  notes: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        property: {
          ownerId: session.user.id,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            province: true,
            primaryImageUrl: true,
            checkInTime: true,
            checkOutTime: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify booking belongs to user's property
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        property: {
          ownerId: session.user.id,
        },
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateBookingSchema.parse(body);

    // If dates are being updated, check for overlapping bookings
    if (validatedData.checkInDate || validatedData.checkOutDate) {
      const checkIn = validatedData.checkInDate
        ? new Date(validatedData.checkInDate)
        : existingBooking.checkInDate;
      const checkOut = validatedData.checkOutDate
        ? new Date(validatedData.checkOutDate)
        : existingBooking.checkOutDate;

      const overlapping = await prisma.booking.findFirst({
        where: {
          propertyId: existingBooking.propertyId,
          id: { not: id },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          OR: [
            {
              AND: [{ checkInDate: { lte: checkIn } }, { checkOutDate: { gt: checkIn } }],
            },
            {
              AND: [{ checkInDate: { lt: checkOut } }, { checkOutDate: { gte: checkOut } }],
            },
            {
              AND: [{ checkInDate: { gte: checkIn } }, { checkOutDate: { lte: checkOut } }],
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
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...validatedData,
        checkInDate: validatedData.checkInDate ? new Date(validatedData.checkInDate) : undefined,
        checkOutDate: validatedData.checkOutDate ? new Date(validatedData.checkOutDate) : undefined,
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

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify booking belongs to user's property
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        property: {
          ownerId: session.user.id,
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
