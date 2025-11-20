import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Export property calendar as iCal
export async function GET(request: NextRequest) {
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

    // Get all bookings for this property
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'] },
      },
      select: {
        id: true,
        bookingReference: true,
        guestName: true,
        checkInDate: true,
        checkOutDate: true,
        numberOfGuests: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate iCal format
    const icalEvents = bookings.map((booking: (typeof bookings)[number]) => {
      const dtstart = formatICalDate(booking.checkInDate);
      const dtend = formatICalDate(booking.checkOutDate);
      const dtstamp = formatICalDateTime(booking.createdAt);
      const lastModified = formatICalDateTime(booking.updatedAt);

      return `BEGIN:VEVENT
UID:${booking.id}@property-crm
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtend}
SUMMARY:${escapeICalText(booking.guestName)} - ${booking.bookingReference}
DESCRIPTION:Booking for ${booking.numberOfGuests} guest(s)\\nStatus: ${booking.status}
STATUS:CONFIRMED
LAST-MODIFIED:${lastModified}
END:VEVENT`;
    });

    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Property CRM//Booking Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${escapeICalText(property.name)} - Bookings
X-WR-TIMEZONE:Africa/Johannesburg
${icalEvents.join('\n')}
END:VCALENDAR`;

    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${property.name.replace(/[^a-z0-9]/gi, '_')}_calendar.ics"`,
      },
    });
  } catch (error) {
    console.error('Error exporting calendar:', error);
    return NextResponse.json({ error: 'Failed to export calendar' }, { status: 500 });
  }
}

function formatICalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatICalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
