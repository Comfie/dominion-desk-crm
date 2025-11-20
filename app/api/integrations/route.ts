import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List all integrations for user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await prisma.integration.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        platform: true,
        isActive: true,
        syncEnabled: true,
        lastSyncAt: true,
        status: true,
        errorMessage: true,
        connectedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Define all available platforms with their details
    const platformDetails = {
      AIRBNB: {
        name: 'Airbnb',
        description: 'Import bookings and sync calendar with Airbnb',
        icon: 'airbnb',
        category: 'booking',
        features: ['Import bookings', 'Sync calendar', 'Sync reviews'],
      },
      BOOKING_COM: {
        name: 'Booking.com',
        description: 'Connect your Booking.com property listings',
        icon: 'booking',
        category: 'booking',
        features: ['Import bookings', 'Sync availability', 'Sync rates'],
      },
      GOOGLE_CALENDAR: {
        name: 'Google Calendar',
        description: 'Sync bookings with Google Calendar',
        icon: 'google',
        category: 'calendar',
        features: ['Two-way sync', 'Block dates', 'Auto-updates'],
      },
      PAYSTACK: {
        name: 'Paystack',
        description: 'Accept payments in South Africa',
        icon: 'paystack',
        category: 'payment',
        features: ['Card payments', 'EFT', 'USSD', 'QR code'],
      },
      STRIPE: {
        name: 'Stripe',
        description: 'Accept international payments',
        icon: 'stripe',
        category: 'payment',
        features: ['Credit cards', 'Bank transfers', 'Subscriptions'],
      },
      WHATSAPP: {
        name: 'WhatsApp Business',
        description: 'Send notifications via WhatsApp',
        icon: 'whatsapp',
        category: 'communication',
        features: ['Booking confirmations', 'Reminders', 'Quick replies'],
      },
      QUICKBOOKS: {
        name: 'QuickBooks',
        description: 'Sync financial data with QuickBooks',
        icon: 'quickbooks',
        category: 'accounting',
        features: ['Sync invoices', 'Sync expenses', 'Financial reports'],
      },
    };

    // Build response with all platforms
    const allPlatforms = Object.keys(platformDetails).map((platform: string) => {
      const existing = integrations.find(
        (i: (typeof integrations)[number]) => i.platform === platform
      );
      const details = platformDetails[platform as keyof typeof platformDetails];

      return {
        platform,
        ...details,
        integration: existing || null,
        isConnected: existing?.status === 'CONNECTED',
        isActive: existing?.isActive || false,
      };
    });

    // Group by category
    const byCategory = {
      booking: allPlatforms.filter((p: (typeof allPlatforms)[number]) => p.category === 'booking'),
      calendar: allPlatforms.filter(
        (p: (typeof allPlatforms)[number]) => p.category === 'calendar'
      ),
      payment: allPlatforms.filter((p: (typeof allPlatforms)[number]) => p.category === 'payment'),
      communication: allPlatforms.filter(
        (p: (typeof allPlatforms)[number]) => p.category === 'communication'
      ),
      accounting: allPlatforms.filter(
        (p: (typeof allPlatforms)[number]) => p.category === 'accounting'
      ),
    };

    return NextResponse.json({
      integrations: allPlatforms,
      byCategory,
      connectedCount: integrations.filter(
        (i: (typeof integrations)[number]) => i.status === 'CONNECTED'
      ).length,
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}

// POST - Connect/Initialize integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, apiKey, accessToken, refreshToken } = await request.json();

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    // Check if integration already exists
    const existing = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform,
        },
      },
    });

    if (existing) {
      // Update existing integration
      const updated = await prisma.integration.update({
        where: { id: existing.id },
        data: {
          apiKey,
          accessToken,
          refreshToken,
          isActive: true,
          status: 'CONNECTED',
          connectedAt: new Date(),
          errorMessage: null,
        },
      });

      return NextResponse.json({
        message: 'Integration updated successfully',
        integration: {
          id: updated.id,
          platform: updated.platform,
          isActive: updated.isActive,
          status: updated.status,
          connectedAt: updated.connectedAt,
        },
      });
    }

    // Create new integration
    const integration = await prisma.integration.create({
      data: {
        userId: session.user.id,
        platform,
        apiKey,
        accessToken,
        refreshToken,
        isActive: true,
        status: 'CONNECTED',
        connectedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Integration connected successfully',
      integration: {
        id: integration.id,
        platform: integration.platform,
        isActive: integration.isActive,
        status: integration.status,
        connectedAt: integration.connectedAt,
      },
    });
  } catch (error) {
    console.error('Error connecting integration:', error);
    return NextResponse.json({ error: 'Failed to connect integration' }, { status: 500 });
  }
}
