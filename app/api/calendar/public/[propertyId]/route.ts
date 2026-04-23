import { NextResponse } from 'next/server';

import { generatePublicPropertyCalendar } from '@/lib/calendar-sync';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params;
    const icalData = await generatePublicPropertyCalendar(propertyId);

    return new NextResponse(icalData, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="property-${propertyId}.ics"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load calendar' }, { status: 404 });
  }
}
