import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Import calendar events from iCal URL
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId, calendarUrl } = await request.json();

    if (!propertyId || !calendarUrl) {
      return NextResponse.json(
        { error: 'Property ID and calendar URL are required' },
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

    // Fetch and parse iCal
    const response = await fetch(calendarUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch calendar URL' }, { status: 400 });
    }

    const icalData = await response.text();
    const events = parseICal(icalData);

    // Create bookings for blocked dates
    let imported = 0;
    for (const event of events) {
      // Check for existing booking with same external ID
      const existing = await prisma.booking.findFirst({
        where: {
          propertyId,
          externalId: event.uid,
        },
      });

      if (!existing) {
        // Generate booking reference
        const bookingReference = `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Calculate nights
        const nights = Math.ceil(
          (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        await prisma.booking.create({
          data: {
            userId: session.user.id,
            propertyId,
            bookingReference,
            bookingType: 'SHORT_TERM',
            checkInDate: event.startDate,
            checkOutDate: event.endDate,
            numberOfNights: nights,
            guestName: event.summary || 'Imported Booking',
            guestEmail: 'imported@external.com',
            guestPhone: '',
            numberOfGuests: 1,
            baseRate: 0,
            totalAmount: 0,
            amountDue: 0,
            bookingSource:
              event.source === 'airbnb'
                ? 'AIRBNB'
                : event.source === 'booking'
                  ? 'BOOKING_COM'
                  : 'OTHER',
            externalId: event.uid,
            status: 'CONFIRMED',
            internalNotes: `Imported from calendar: ${event.description || ''}`,
          },
        });
        imported++;
      }
    }

    // Update property with calendar URL
    const currentUrls = (property.calendarUrls as string[]) || [];
    if (!currentUrls.includes(calendarUrl)) {
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          calendarUrls: [...currentUrls, calendarUrl],
          syncCalendar: true,
        },
      });
    }

    return NextResponse.json({
      message: `Successfully imported ${imported} bookings`,
      imported,
      total: events.length,
    });
  } catch (error) {
    console.error('Error importing calendar:', error);
    return NextResponse.json({ error: 'Failed to import calendar' }, { status: 500 });
  }
}

// Simple iCal parser
function parseICal(icalData: string): Array<{
  uid: string;
  summary: string;
  description: string;
  startDate: Date;
  endDate: Date;
  source: string;
}> {
  const events: Array<{
    uid: string;
    summary: string;
    description: string;
    startDate: Date;
    endDate: Date;
    source: string;
  }> = [];

  const lines = icalData.split(/\r?\n/);
  let currentEvent: any = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.uid && currentEvent.dtstart && currentEvent.dtend) {
        // Determine source from UID or description
        let source = 'other';
        if (
          currentEvent.uid.includes('airbnb') ||
          currentEvent.summary?.toLowerCase().includes('airbnb')
        ) {
          source = 'airbnb';
        } else if (
          currentEvent.uid.includes('booking') ||
          currentEvent.summary?.toLowerCase().includes('booking.com')
        ) {
          source = 'booking';
        }

        events.push({
          uid: currentEvent.uid,
          summary: currentEvent.summary || '',
          description: currentEvent.description || '',
          startDate: parseICalDate(currentEvent.dtstart),
          endDate: parseICalDate(currentEvent.dtend),
          source,
        });
      }
      currentEvent = null;
    } else if (currentEvent) {
      const match = line.match(/^([^:;]+)(?:;[^:]*)?:(.*)$/);
      if (match) {
        const [, key, value] = match;
        switch (key.toUpperCase()) {
          case 'UID':
            currentEvent.uid = value;
            break;
          case 'SUMMARY':
            currentEvent.summary = value;
            break;
          case 'DESCRIPTION':
            currentEvent.description = value;
            break;
          case 'DTSTART':
            currentEvent.dtstart = value;
            break;
          case 'DTEND':
            currentEvent.dtend = value;
            break;
        }
      }
    }
  }

  return events;
}

function parseICalDate(dateStr: string): Date {
  // Handle different date formats
  if (dateStr.includes('T')) {
    // Format: 20230101T120000Z or 20230101T120000
    const year = parseInt(dateStr.substr(0, 4));
    const month = parseInt(dateStr.substr(4, 2)) - 1;
    const day = parseInt(dateStr.substr(6, 2));
    const hour = parseInt(dateStr.substr(9, 2)) || 0;
    const minute = parseInt(dateStr.substr(11, 2)) || 0;
    const second = parseInt(dateStr.substr(13, 2)) || 0;

    if (dateStr.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
    return new Date(year, month, day, hour, minute, second);
  } else {
    // Format: 20230101 (date only)
    const year = parseInt(dateStr.substr(0, 4));
    const month = parseInt(dateStr.substr(4, 2)) - 1;
    const day = parseInt(dateStr.substr(6, 2));
    return new Date(year, month, day);
  }
}
