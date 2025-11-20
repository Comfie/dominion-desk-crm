import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { checkAvailability } from '@/lib/calendar-sync';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const excludeBookingId = searchParams.get('excludeBookingId');

    if (!propertyId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Property ID, check-in date, and check-out date are required' },
        { status: 400 }
      );
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    if (checkInDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      return NextResponse.json({ error: 'Check-in date cannot be in the past' }, { status: 400 });
    }

    // Check property minimum/maximum stay
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (property.minimumStay && nights < property.minimumStay) {
      return NextResponse.json({
        available: false,
        reason: `Minimum stay is ${property.minimumStay} nights`,
        conflicts: [],
      });
    }

    if (property.maximumStay && nights > property.maximumStay) {
      return NextResponse.json({
        available: false,
        reason: `Maximum stay is ${property.maximumStay} nights`,
        conflicts: [],
      });
    }

    // Check for conflicts
    const result = await checkAvailability(
      propertyId,
      checkInDate,
      checkOutDate,
      excludeBookingId || undefined
    );

    return NextResponse.json({
      ...result,
      nights,
      propertyName: property.name,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}

// Batch availability check for multiple properties
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyIds, checkIn, checkOut } = await request.json();

    if (!propertyIds || !Array.isArray(propertyIds) || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Property IDs array, check-in date, and check-out date are required' },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Get all properties
    const properties = await prisma.property.findMany({
      where: {
        id: { in: propertyIds },
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const results: Array<{
      propertyId: string;
      propertyName: string;
      available: boolean;
      conflictCount: number;
    }> = [];

    for (const property of properties) {
      const result = await checkAvailability(property.id, checkInDate, checkOutDate);
      results.push({
        propertyId: property.id,
        propertyName: property.name,
        available: result.available,
        conflictCount: result.conflicts.length,
      });
    }

    return NextResponse.json({
      results,
      availableCount: results.filter((r: (typeof results)[number]) => r.available).length,
      totalChecked: results.length,
    });
  } catch (error) {
    console.error('Error checking batch availability:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}
