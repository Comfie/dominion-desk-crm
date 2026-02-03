import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateSubscriptionBilling } from '@/lib/services/subscription.service';
import {
  buildSubscriptionPaymentData,
  generateMerchantReference,
  getPayFastUrl,
} from '@/lib/services/payfast.service';
import { logger } from '@/lib/shared/logger';

/**
 * POST /api/payfast/initiate-subscription
 * Initiates a PayFast subscription payment
 * Returns payment form data for redirecting user to PayFast
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
        payfastSubscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has an active subscription
    if (user.subscriptionStatus === 'ACTIVE') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }

    // Check if there's a pending PayFast subscription
    if (user.payfastSubscription && user.payfastSubscription.status === 'PENDING') {
      // Reuse existing merchant reference
      const existingSub = user.payfastSubscription;
      const billing = await calculateSubscriptionBilling(userId);

      const paymentData = buildSubscriptionPaymentData({
        userId,
        amount: billing.totalMonthlyFee,
        itemName: 'DominionDesk Subscription',
        email: user.email,
        merchantReference: existingSub.merchantReference,
      });

      return NextResponse.json({
        paymentData,
        payfastUrl: getPayFastUrl(),
        merchantReference: existingSub.merchantReference,
        amount: billing.totalMonthlyFee,
      });
    }

    // Calculate subscription billing
    const billing = await calculateSubscriptionBilling(userId);

    // Generate unique merchant reference
    const merchantReference = generateMerchantReference(userId);

    // Create PayFast subscription record
    await prisma.payFastSubscription.create({
      data: {
        userId,
        merchantReference,
        amount: billing.totalMonthlyFee,
        frequency: 3, // Monthly
        cycles: 0, // Infinite
        status: 'PENDING',
      },
    });

    // Build PayFast payment data
    const paymentData = buildSubscriptionPaymentData({
      userId,
      amount: billing.totalMonthlyFee,
      itemName: 'DominionDesk Subscription',
      email: user.email,
      merchantReference,
    });

    logger.info('PayFast subscription initiated', {
      userId,
      merchantReference,
      amount: billing.totalMonthlyFee,
    });

    return NextResponse.json({
      paymentData,
      payfastUrl: getPayFastUrl(),
      merchantReference,
      amount: billing.totalMonthlyFee,
    });
  } catch (error) {
    logger.error('Failed to initiate PayFast subscription', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: 'Failed to initiate subscription payment' }, { status: 500 });
  }
}
