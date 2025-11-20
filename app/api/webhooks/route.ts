import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List webhooks (for future webhook management)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a full implementation, this would list user's configured webhooks
    // For now, return supported webhook events
    const webhookEvents = [
      {
        event: 'booking.created',
        description: 'Triggered when a new booking is created',
      },
      {
        event: 'booking.updated',
        description: 'Triggered when a booking is modified',
      },
      {
        event: 'booking.cancelled',
        description: 'Triggered when a booking is cancelled',
      },
      {
        event: 'booking.checked_in',
        description: 'Triggered when a guest checks in',
      },
      {
        event: 'booking.checked_out',
        description: 'Triggered when a guest checks out',
      },
      {
        event: 'payment.received',
        description: 'Triggered when a payment is received',
      },
      {
        event: 'payment.failed',
        description: 'Triggered when a payment fails',
      },
      {
        event: 'inquiry.created',
        description: 'Triggered when a new inquiry is received',
      },
      {
        event: 'maintenance.created',
        description: 'Triggered when a maintenance request is created',
      },
      {
        event: 'maintenance.completed',
        description: 'Triggered when maintenance is completed',
      },
    ];

    return NextResponse.json({
      webhookEvents,
      registeredWebhooks: [], // Would list user's registered webhooks
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

// POST - Register a new webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, events, secret } = await request.json();

    if (!url || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'URL and at least one event are required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // In a full implementation, this would store the webhook in the database
    // For now, return success with generated secret
    const webhookSecret = secret || generateWebhookSecret();

    return NextResponse.json({
      message: 'Webhook registered successfully',
      webhook: {
        id: `wh_${Date.now()}`,
        url,
        events,
        secret: webhookSecret,
        isActive: true,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error registering webhook:', error);
    return NextResponse.json({ error: 'Failed to register webhook' }, { status: 500 });
  }
}

function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = 'whsec_';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Webhook delivery helper (would be used by other API routes)
export async function deliverWebhook(userId: string, event: string, payload: any) {
  // In a full implementation:
  // 1. Look up user's registered webhooks for this event
  // 2. For each webhook, send HTTP POST request
  // 3. Sign payload with webhook secret
  // 4. Log delivery status

  console.log(`Webhook delivery: ${event} for user ${userId}`, payload);
}
