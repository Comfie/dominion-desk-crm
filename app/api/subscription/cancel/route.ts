import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cancelSubscription } from '@/lib/services/subscription.service';
import { logger } from '@/lib/shared/logger';

/**
 * POST /api/subscription/cancel
 * Allows users to cancel their active subscription
 * Cancels paid billing and moves the account to the free tier
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body for optional cancellation reason
    const body = await req.json().catch(() => ({}));
    const { reason } = body;
    const cancellationReason = typeof reason === 'string' ? reason.trim() : '';

    if (!cancellationReason) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    // Get user's subscription status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        payfastSubscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an active subscription
    if (user.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 });
    }

    // Check if there's a PayFast subscription
    if (!user.payfastSubscription) {
      return NextResponse.json({ error: 'No PayFast subscription found' }, { status: 404 });
    }

    // Cancel the subscription
    const cancellation = await cancelSubscription(userId, cancellationReason, userId);

    logger.info('Subscription cancelled by user', {
      userId,
      reason: cancellationReason,
      subscriptionEndsAt: user.subscriptionEndsAt,
      currentTier: cancellation.currentTier,
      scheduledDowngradeTier: cancellation.scheduledDowngradeTier,
      propertyLimit: cancellation.propertyLimit,
      propertyCount: cancellation.propertyCount,
      propertiesAboveFreeTierCount: cancellation.propertiesAboveFreeTierCount,
      userConfirmationSent: cancellation.emails.userConfirmationSent,
      adminNotificationSent: cancellation.emails.adminNotificationSent,
    });

    // Return cancellation details
    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      accessUntil: cancellation.accessUntil,
      details: {
        status: 'CANCELLED',
        tier: cancellation.currentTier,
        scheduledDowngradeTier: cancellation.scheduledDowngradeTier,
        propertyLimit: cancellation.propertyLimit,
        freeTierPropertyLimit: cancellation.freeTierPropertyLimit,
        propertyCount: cancellation.propertyCount,
        propertiesAboveFreeTierCount: cancellation.propertiesAboveFreeTierCount,
        downgradeEffectiveAt: cancellation.downgradeEffectiveAt,
        confirmationEmailSent: cancellation.emails.userConfirmationSent,
        note:
          cancellation.propertiesAboveFreeTierCount > 0
            ? `Your paid plan remains active until your subscription end date. After that, ${cancellation.propertiesAboveFreeTierCount} properties will be above the free tier limit.`
            : 'Your paid plan remains active until your subscription end date and will not renew.',
      },
    });
  } catch (error) {
    logger.error('Failed to cancel subscription', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
