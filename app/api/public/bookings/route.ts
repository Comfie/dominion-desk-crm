import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const bookingRequestSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  guestName: z.string().min(1, 'Name is required'),
  guestEmail: z.string().email('Valid email is required'),
  guestPhone: z.string().min(1, 'Phone is required'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  numberOfGuests: z.coerce.number().min(1, 'Number of guests required'),
  specialRequests: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = bookingRequestSchema.parse(body);

    // Get the property with its pricing
    const property = await prisma.property.findUnique({
      where: { id: validatedData.propertyId },
      select: {
        id: true,
        name: true,
        userId: true,
        dailyRate: true,
        monthlyRent: true,
        rentalType: true,
        status: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Property is not available for booking' }, { status: 400 });
    }

    const checkIn = new Date(validatedData.checkInDate);
    const checkOut = new Date(validatedData.checkOutDate);

    // Validate dates
    if (checkIn >= checkOut) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    if (checkIn < new Date()) {
      return NextResponse.json({ error: 'Check-in date must be in the future' }, { status: 400 });
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: validatedData.propertyId,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        OR: [
          {
            checkInDate: { lte: checkOut },
            checkOutDate: { gte: checkIn },
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Property is not available for these dates' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    let totalAmount = 0;

    if (property.dailyRate) {
      totalAmount = Number(property.dailyRate) * nights;
    } else if (property.monthlyRent) {
      // For long-term rentals, calculate based on monthly rate
      totalAmount = (Number(property.monthlyRent) / 30) * nights;
    }

    // Generate booking reference
    const bookingReference = `BK${Date.now().toString(36).toUpperCase()}`;
    const baseRate = property.dailyRate
      ? Number(property.dailyRate)
      : property.monthlyRent
        ? Number(property.monthlyRent) / 30
        : 0;

    // Create the booking request as PENDING
    const booking = await prisma.booking.create({
      data: {
        propertyId: validatedData.propertyId,
        userId: property.userId,
        bookingReference,
        bookingType: 'SHORT_TERM',
        guestName: validatedData.guestName,
        guestEmail: validatedData.guestEmail,
        guestPhone: validatedData.guestPhone,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfNights: nights,
        numberOfGuests: validatedData.numberOfGuests,
        baseRate,
        totalAmount: totalAmount,
        amountDue: totalAmount,
        amountPaid: 0,
        status: 'PENDING',
        bookingSource: 'WEBSITE',
        guestNotes: validatedData.specialRequests,
      },
    });

    // TODO: Send email notification to property owner about new booking request
    console.log(`New booking request for property ${property.name}:`, {
      bookingId: booking.id,
      guest: validatedData.guestName,
      dates: `${validatedData.checkInDate} to ${validatedData.checkOutDate}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Booking request submitted successfully',
      bookingId: booking.id,
      totalAmount: totalAmount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Public booking error:', error);
    return NextResponse.json({ error: 'Failed to submit booking request' }, { status: 500 });
  }
}
