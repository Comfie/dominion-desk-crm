import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { syncExternalCalendar } from '@/lib/calendar-sync';

const syncSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  calendarUrl: z.string().url('Invalid calendar URL'),
  source: z.enum(['AIRBNB', 'BOOKING_COM', 'OTHER']).default('OTHER'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, calendarUrl, source } = syncSchema.parse(body);

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

    // Perform sync
    const result = await syncExternalCalendar(propertyId, session.user.id, calendarUrl, source);

    // Update property with calendar URL if not already stored
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
      message: 'Calendar synced successfully',
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error syncing calendar:', error);
    return NextResponse.json({ error: 'Failed to sync calendar' }, { status: 500 });
  }
}

// Sync all calendars for a property
export async function PUT(request: Request) {
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

    const calendarUrls = (property.calendarUrls as string[]) || [];

    if (calendarUrls.length === 0) {
      return NextResponse.json({
        message: 'No calendars to sync',
        imported: 0,
        updated: 0,
        errors: [],
      });
    }

    // Sync all calendars
    let totalImported = 0;
    let totalUpdated = 0;
    const allErrors: string[] = [];

    for (const url of calendarUrls) {
      // Detect source from URL
      let source: 'AIRBNB' | 'BOOKING_COM' | 'OTHER' = 'OTHER';
      if (url.includes('airbnb')) source = 'AIRBNB';
      else if (url.includes('booking.com')) source = 'BOOKING_COM';

      const result = await syncExternalCalendar(propertyId, session.user.id, url, source);
      totalImported += result.imported;
      totalUpdated += result.updated;
      allErrors.push(...result.errors);
    }

    return NextResponse.json({
      message: 'All calendars synced successfully',
      imported: totalImported,
      updated: totalUpdated,
      errors: allErrors,
    });
  } catch (error) {
    console.error('Error syncing all calendars:', error);
    return NextResponse.json({ error: 'Failed to sync calendars' }, { status: 500 });
  }
}
