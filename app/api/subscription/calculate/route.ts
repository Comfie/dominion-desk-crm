import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateSubscriptionBilling } from '@/lib/services/subscription.service';

/**
 * GET /api/subscription/calculate
 * Calculate the current subscription billing amount for the logged-in user
 * Returns breakdown by property with individual fees
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billing = await calculateSubscriptionBilling(session.user.id);

    return NextResponse.json(billing);
  } catch (error) {
    console.error('Error calculating subscription:', error);
    return NextResponse.json({ error: 'Failed to calculate subscription' }, { status: 500 });
  }
}
