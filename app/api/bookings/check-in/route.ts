import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, notes } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Verify booking belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
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

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Validate booking status
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot check in a booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_IN',
        checkedIn: true,
        checkedInAt: new Date(),
        internalNotes: notes
          ? `${booking.internalNotes || ''}\n\nCheck-in notes: ${notes}`.trim()
          : booking.internalNotes,
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

    // Update property status to occupied (optional)
    await prisma.property.update({
      where: { id: booking.propertyId },
      data: { status: 'OCCUPIED' },
    });

    return NextResponse.json({
      message: 'Guest checked in successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error checking in:', error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
}
