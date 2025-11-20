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

    const { bookingId, notes, damageReport, additionalCharges } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Verify booking belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
      select: {
        id: true,
        propertyId: true,
        status: true,
        totalAmount: true,
        amountPaid: true,
        amountDue: true,
        internalNotes: true,
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
    if (booking.status !== 'CHECKED_IN') {
      return NextResponse.json(
        { error: `Cannot check out a booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Check for outstanding payments
    const outstandingAmount = Number(booking.totalAmount) - Number(booking.amountPaid);
    if (outstandingAmount > 0) {
      return NextResponse.json(
        {
          error: `Cannot check out with outstanding payment of R${outstandingAmount.toFixed(2)}. Please collect payment first.`,
          outstandingAmount: outstandingAmount,
        },
        { status: 400 }
      );
    }

    // Build notes
    let checkoutNotes = '';
    if (notes) checkoutNotes += `Check-out notes: ${notes}\n`;
    if (damageReport) checkoutNotes += `Damage report: ${damageReport}\n`;
    if (additionalCharges) checkoutNotes += `Additional charges: R${additionalCharges}\n`;

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_OUT',
        checkedOut: true,
        checkedOutAt: new Date(),
        internalNotes: checkoutNotes
          ? `${booking.internalNotes || ''}\n\n${checkoutNotes}`.trim()
          : booking.internalNotes,
        // Add additional charges to amount due if provided
        amountDue: additionalCharges
          ? Number(booking.amountDue) + Number(additionalCharges)
          : booking.amountDue,
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

    // Check if there are any other active bookings for this property
    const activeBookings = await prisma.booking.findFirst({
      where: {
        propertyId: booking.propertyId,
        status: 'CHECKED_IN',
        id: { not: bookingId },
      },
    });

    // Update property status back to active if no other active bookings
    if (!activeBookings) {
      await prisma.property.update({
        where: { id: booking.propertyId },
        data: { status: 'ACTIVE' },
      });
    }

    return NextResponse.json({
      message: 'Guest checked out successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error checking out:', error);
    return NextResponse.json({ error: 'Failed to check out' }, { status: 500 });
  }
}
