import ical from 'node-ical';
import prisma from '@/lib/db';

export interface CalendarEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
}

export interface SyncResult {
  imported: number;
  updated: number;
  errors: string[];
}

/**
 * Parse iCal data from a URL
 */
export async function parseICalFromUrl(url: string): Promise<CalendarEvent[]> {
  try {
    const events = await ical.async.fromURL(url);
    const calendarEvents: CalendarEvent[] = [];

    for (const key in events) {
      const event = events[key]!;
      if (event.type === 'VEVENT' && event.start && event.end) {
        calendarEvents.push({
          uid: event.uid || key,
          summary: event.summary || 'Blocked',
          start: new Date(event.start),
          end: new Date(event.end),
          description: event.description,
        });
      }
    }

    return calendarEvents;
  } catch (error) {
    console.error('Error parsing iCal from URL:', error);
    throw new Error(`Failed to parse calendar from URL: ${url}`);
  }
}

/**
 * Sync external calendar events to bookings
 */
export async function syncExternalCalendar(
  propertyId: string,
  userId: string,
  calendarUrl: string,
  source: 'AIRBNB' | 'BOOKING_COM' | 'OTHER' = 'OTHER'
): Promise<SyncResult> {
  const result: SyncResult = {
    imported: 0,
    updated: 0,
    errors: [],
  };

  try {
    const events = await parseICalFromUrl(calendarUrl);

    for (const event of events) {
      try {
        // Check if booking with this external ID already exists
        const existingBooking = await prisma.booking.findFirst({
          where: {
            propertyId,
            externalId: event.uid,
          },
        });

        const numberOfNights = Math.ceil(
          (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (existingBooking) {
          // Update existing booking
          await prisma.booking.update({
            where: { id: existingBooking.id },
            data: {
              checkInDate: event.start,
              checkOutDate: event.end,
              numberOfNights,
              guestName: event.summary || 'External Booking',
            },
          });
          result.updated++;
        } else {
          // Create new booking from external event
          const bookingReference = `EXT-${source}-${Date.now().toString(36).toUpperCase()}`;

          await prisma.booking.create({
            data: {
              userId,
              propertyId,
              bookingReference,
              bookingType: 'SHORT_TERM',
              checkInDate: event.start,
              checkOutDate: event.end,
              numberOfNights,
              guestName: event.summary || 'External Booking',
              guestEmail: 'external@booking.com',
              guestPhone: '',
              numberOfGuests: 1,
              baseRate: 0,
              totalAmount: 0,
              amountDue: 0,
              status: 'CONFIRMED',
              bookingSource: source,
              externalId: event.uid,
              internalNotes: `Imported from ${source} calendar`,
            },
          });
          result.imported++;
        }
      } catch (eventError) {
        result.errors.push(`Failed to sync event ${event.uid}: ${eventError}`);
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Failed to sync calendar: ${error}`);
    return result;
  }
}

/**
 * Generate iCal feed for a property
 */
export async function generatePropertyCalendar(
  propertyId: string,
  userId: string
): Promise<string> {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      userId,
    },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  const bookings = await prisma.booking.findMany({
    where: {
      propertyId,
      status: {
        in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'],
      },
    },
    orderBy: { checkInDate: 'asc' },
  });

  // Generate iCal format
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dominion Desk//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${property.name}`,
  ];

  for (const booking of bookings) {
    const startDate = formatICalDate(booking.checkInDate);
    const endDate = formatICalDate(booking.checkOutDate);
    const createdDate = formatICalDateTime(booking.createdAt);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${booking.id}@propertycrm.com`,
      `DTSTAMP:${createdDate}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${booking.guestName} - ${booking.status}`,
      `DESCRIPTION:Booking Reference: ${booking.bookingReference}\\nGuests: ${booking.numberOfGuests}\\nSource: ${booking.bookingSource}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Check availability for a property
 */
export async function checkAvailability(
  propertyId: string,
  checkInDate: Date,
  checkOutDate: Date,
  excludeBookingId?: string
): Promise<{
  available: boolean;
  conflicts: Array<{ id: string; guestName: string; checkInDate: Date; checkOutDate: Date }>;
  reason?: string;
}> {
  // First check if property has active tenant lease
  const activeTenantLeases = await prisma.propertyTenant.findMany({
    where: {
      propertyId,
      isActive: true,
      OR: [
        {
          // Tenant lease overlaps with requested dates
          AND: [
            { leaseStartDate: { lte: checkOutDate } },
            {
              OR: [
                { leaseEndDate: { gte: checkInDate } },
                { leaseEndDate: null }, // No end date means ongoing lease
              ],
            },
          ],
        },
      ],
    },
    include: {
      tenant: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (activeTenantLeases.length > 0) {
    const tenant = activeTenantLeases[0]?.tenant;
    return {
      available: false,
      conflicts: [],
      reason: `Property has an active tenant lease (${tenant?.firstName} ${tenant?.lastName})`,
    };
  }

  // Check for overlapping bookings
  const where: Record<string, unknown> = {
    propertyId,
    status: {
      in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'],
    },
    OR: [
      {
        // New booking starts during existing booking
        AND: [{ checkInDate: { lte: checkInDate } }, { checkOutDate: { gt: checkInDate } }],
      },
      {
        // New booking ends during existing booking
        AND: [{ checkInDate: { lt: checkOutDate } }, { checkOutDate: { gte: checkOutDate } }],
      },
      {
        // New booking contains existing booking
        AND: [{ checkInDate: { gte: checkInDate } }, { checkOutDate: { lte: checkOutDate } }],
      },
    ],
  };

  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  const overlappingBookings = await prisma.booking.findMany({
    where,
    select: {
      id: true,
      guestName: true,
      checkInDate: true,
      checkOutDate: true,
    },
  });

  return {
    available: overlappingBookings.length === 0,
    conflicts: overlappingBookings,
    reason: overlappingBookings.length > 0 ? 'Property has overlapping bookings' : undefined,
  };
}

/**
 * Format date for iCal (YYYYMMDD)
 */
function formatICalDate(date: Date): string {
  return date.toISOString().split('T')[0]!.replace(/-/g, '');
}

/**
 * Format datetime for iCal (YYYYMMDDTHHMMSSZ)
 */
function formatICalDateTime(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}
