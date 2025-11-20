import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Create Stripe payment intent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, amount, currency = 'ZAR' } = await request.json();

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'Booking ID and amount are required' }, { status: 400 });
    }

    // Get Stripe integration
    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: 'STRIPE',
        },
      },
    });

    if (!integration || integration.status !== 'CONNECTED') {
      return NextResponse.json({ error: 'Stripe integration not configured' }, { status: 400 });
    }

    // Verify booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
      include: {
        property: {
          select: { name: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // In production, this would call Stripe API:
    // const stripe = new Stripe(integration.apiKey);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100),
    //   currency: currency.toLowerCase(),
    //   metadata: {
    //     bookingId,
    //     bookingReference: booking.bookingReference,
    //     propertyName: booking.property.name,
    //   },
    // });

    // Mock response for development
    const paymentIntentId = `pi_mock_${Date.now()}`;
    const clientSecret = `${paymentIntentId}_secret_mock`;

    return NextResponse.json({
      success: true,
      paymentIntentId,
      clientSecret,
      amount,
      currency,
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}

// GET - Retrieve Stripe payment status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID is required' }, { status: 400 });
    }

    // Get Stripe integration
    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: 'STRIPE',
        },
      },
    });

    if (!integration || integration.status !== 'CONNECTED') {
      return NextResponse.json({ error: 'Stripe integration not configured' }, { status: 400 });
    }

    // In production, this would retrieve from Stripe:
    // const stripe = new Stripe(integration.apiKey);
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Mock response for development
    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 0,
        currency: 'zar',
        created: Date.now(),
      },
    });
  } catch (error) {
    console.error('Stripe retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve payment' }, { status: 500 });
  }
}
