import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cancelSubscription } from '@/lib/services/subscription.service';
import { logger } from '@/lib/shared/logger';

/**
 * POST /api/subscription/cancel
 * Allows users to cancel their active subscription
 * User retains access until end of billing period
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
    await cancelSubscription(userId, reason, userId);

    logger.info('Subscription cancelled by user', {
      userId,
      reason: reason || 'No reason provided',
      subscriptionEndsAt: user.subscriptionEndsAt,
    });

    // Return cancellation details
    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      accessUntil: user.subscriptionEndsAt,
      details: {
        status: 'CANCELLED',
        note: 'You will retain access until the end of your current billing period',
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
