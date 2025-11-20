import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        propertyType: true,
        address: true,
        city: true,
        province: true,
        bedrooms: true,
        bathrooms: true,
        size: true,
        furnished: true,
        parkingSpaces: true,
        amenities: true,
        rentalType: true,
        monthlyRent: true,
        dailyRate: true,
        securityDeposit: true,
        petsAllowed: true,
        smokingAllowed: true,
        primaryImageUrl: true,
        images: true,
        status: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Only show active properties
    if (property.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Property not available' }, { status: 404 });
    }

    // Get upcoming bookings to show availability
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId: id,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        checkOutDate: { gte: new Date() },
      },
      select: {
        checkInDate: true,
        checkOutDate: true,
      },
      orderBy: { checkInDate: 'asc' },
    });

    return NextResponse.json({
      property,
      bookedDates: bookings.map((b: (typeof bookings)[number]) => ({
        start: b.checkInDate,
        end: b.checkOutDate,
      })),
    });
  } catch (error) {
    console.error('Public property fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}
