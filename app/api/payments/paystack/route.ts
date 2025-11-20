import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Initialize Paystack payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, amount, email, callbackUrl } = await request.json();

    if (!bookingId || !amount || !email) {
      return NextResponse.json(
        { error: 'Booking ID, amount, and email are required' },
        { status: 400 }
      );
    }

    // Get Paystack integration
    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: 'PAYSTACK',
        },
      },
    });

    if (!integration || integration.status !== 'CONNECTED') {
      return NextResponse.json({ error: 'Paystack integration not configured' }, { status: 400 });
    }

    // Verify booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Generate reference
    const reference = `PAY-${booking.bookingReference}-${Date.now()}`;

    // In production, this would call Paystack API:
    // const response = await fetch('https://api.paystack.co/transaction/initialize', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${integration.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     email,
    //     amount: Math.round(amount * 100), // Paystack uses kobo/cents
    //     reference,
    //     callback_url: callbackUrl,
    //     metadata: {
    //       bookingId,
    //       userId: session.user.id,
    //     },
    //   }),
    // });

    // Mock response for development
    const paymentUrl = `https://checkout.paystack.com/mock/${reference}`;

    return NextResponse.json({
      success: true,
      reference,
      authorizationUrl: paymentUrl,
      accessCode: `mock_${reference}`,
    });
  } catch (error) {
    console.error('Paystack initialization error:', error);
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}

// GET - Verify Paystack payment
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    // Get Paystack integration
    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: 'PAYSTACK',
        },
      },
    });

    if (!integration || integration.status !== 'CONNECTED') {
      return NextResponse.json({ error: 'Paystack integration not configured' }, { status: 400 });
    }

    // In production, this would verify with Paystack API:
    // const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    //   headers: {
    //     'Authorization': `Bearer ${integration.apiKey}`,
    //   },
    // });

    // Mock verification for development
    return NextResponse.json({
      success: true,
      data: {
        reference,
        amount: 0,
        currency: 'ZAR',
        status: 'success',
        paidAt: new Date().toISOString(),
        channel: 'card',
      },
    });
  } catch (error) {
    console.error('Paystack verification error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
