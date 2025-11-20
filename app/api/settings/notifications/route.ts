import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Note: This requires adding a NotificationPreferences model or JSON field to User
// For now, we'll use a simple approach with user preferences

// GET - Get notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default preferences - in production, store in database
    const preferences = {
      email: {
        bookingConfirmation: true,
        bookingReminder: true,
        paymentReceived: true,
        paymentReminder: true,
        inquiryReceived: true,
        maintenanceUpdates: true,
        weeklyReport: true,
        monthlyReport: false,
      },
      sms: {
        bookingConfirmation: false,
        checkInReminder: true,
        paymentReminder: false,
        urgentMaintenance: true,
      },
      push: {
        newBooking: true,
        newInquiry: true,
        paymentReceived: true,
        maintenanceRequest: true,
        taskReminder: true,
      },
    };

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// PATCH - Update notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preferences } = await request.json();

    // In production, save to database
    // For now, just return success
    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      preferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
