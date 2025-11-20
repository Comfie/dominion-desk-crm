import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get all properties owned by the user
    const properties = await prisma.property.findMany({
      where: {
        userId: session.user.id,
        isAvailable: true, // Only include properties marked as available
      },
      include: {
        tenants: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            leaseStartDate: true,
            leaseEndDate: true,
          },
        },
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
            },
          },
          select: {
            id: true,
            checkInDate: true,
            checkOutDate: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Filter properties based on availability criteria
    const availableProperties = properties.filter((property) => {
      // Criteria 1: No active tenant assignments
      if (property.tenants.length > 0) {
        return false;
      }

      // Criteria 2: No overlapping bookings (if dates provided)
      if (startDate && property.bookings.length > 0) {
        const leaseStart = new Date(startDate);
        const leaseEnd = endDate ? new Date(endDate) : null;

        const hasOverlap = property.bookings.some((booking) => {
          const bookingStart = new Date(booking.checkInDate);
          const bookingEnd = new Date(booking.checkOutDate);

          // Check for overlap
          if (leaseEnd) {
            // Has lease end date - check if booking overlaps with lease period
            return (
              (bookingStart >= leaseStart && bookingStart <= leaseEnd) ||
              (bookingEnd >= leaseStart && bookingEnd <= leaseEnd) ||
              (bookingStart <= leaseStart && bookingEnd >= leaseEnd)
            );
          } else {
            // No lease end date - check if booking starts after lease start
            return bookingEnd >= leaseStart;
          }
        });

        if (hasOverlap) {
          return false;
        }
      }

      return true;
    });

    // Return simplified property data
    const formattedProperties = availableProperties.map((property) => ({
      id: property.id,
      name: property.name,
      address: property.address,
      city: property.city,
      province: property.province,
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpaces: property.parkingSpaces,
      monthlyRent: property.monthlyRent,
      securityDeposit: property.securityDeposit,
    }));

    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Error fetching available properties:', error);
    return NextResponse.json({ error: 'Failed to fetch available properties' }, { status: 500 });
  }
}
