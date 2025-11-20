import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { generatePropertyCalendar } from '@/lib/calendar-sync';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Generate calendar
    const icalData = await generatePropertyCalendar(propertyId, session.user.id);

    // Return as iCal file
    return new NextResponse(icalData, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="property-${propertyId}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error exporting calendar:', error);
    return NextResponse.json({ error: 'Failed to export calendar' }, { status: 500 });
  }
}

// Get calendar URL for sharing
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
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

    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const calendarUrl = `${baseUrl}/api/calendar/public/${propertyId}`;

    return NextResponse.json({
      calendarUrl,
      message: 'Use this URL to share your calendar with external platforms',
    });
  } catch (error) {
    console.error('Error generating calendar URL:', error);
    return NextResponse.json({ error: 'Failed to generate calendar URL' }, { status: 500 });
  }
}
