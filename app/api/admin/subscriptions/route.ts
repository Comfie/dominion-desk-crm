import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/auth-helpers';
import prisma from '@/lib/db';

const updateSubscriptionSchema = z.object({
  userId: z.string(),
  subscriptionTier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  subscriptionStatus: z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED']).optional(),
  subscriptionEndsAt: z.string().optional().nullable(),
  extendTrialDays: z.number().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'subscriptionEndsAt';

    // Build where clause
    const where: any = {
      role: 'CUSTOMER',
    };

    if (status) {
      where.subscriptionStatus = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy:
        sortBy === 'subscriptionEndsAt' ? { subscriptionEndsAt: 'asc' } : { updatedAt: 'desc' },
    });

    // Calculate MRR for each user
    const subscriptions = users.map((user) => {
      let mrr = 0;
      if (user.subscriptionStatus === 'ACTIVE') {
        switch (user.subscriptionTier) {
          case 'STARTER':
            mrr = 199;
            break;
          case 'PROFESSIONAL':
            mrr = 499;
            break;
          case 'ENTERPRISE':
            mrr = 999;
            break;
        }
      }

      return {
        ...user,
        mrr,
        nextBillingDate: user.subscriptionEndsAt,
      };
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    // Verify user exists and is a CUSTOMER
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.userId, role: 'CUSTOMER' },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};

    // Handle tier change
    if (validatedData.subscriptionTier) {
      updateData.subscriptionTier = validatedData.subscriptionTier;

      // Update property limit based on tier
      switch (validatedData.subscriptionTier) {
        case 'FREE':
          updateData.propertyLimit = 1;
          break;
        case 'STARTER':
          updateData.propertyLimit = 5;
          break;
        case 'PROFESSIONAL':
          updateData.propertyLimit = 20;
          break;
        case 'ENTERPRISE':
          updateData.propertyLimit = 999999;
          break;
      }
    }

    // Handle status change
    if (validatedData.subscriptionStatus) {
      updateData.subscriptionStatus = validatedData.subscriptionStatus;

      // If activating, set subscription end date to 30 days from now
      if (validatedData.subscriptionStatus === 'ACTIVE' && !validatedData.subscriptionEndsAt) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        updateData.subscriptionEndsAt = endDate;
      }

      // If cancelling, keep current end date but set status
      if (validatedData.subscriptionStatus === 'CANCELLED') {
        // End date remains the same
      }
    }

    // Handle subscription end date
    if (validatedData.subscriptionEndsAt !== undefined) {
      updateData.subscriptionEndsAt = validatedData.subscriptionEndsAt
        ? new Date(validatedData.subscriptionEndsAt)
        : null;
    }

    // Handle trial extension
    if (validatedData.extendTrialDays) {
      const newTrialEndDate = existingUser.trialEndsAt
        ? new Date(existingUser.trialEndsAt)
        : new Date();
      newTrialEndDate.setDate(newTrialEndDate.getDate() + validatedData.extendTrialDays);
      updateData.trialEndsAt = newTrialEndDate;
      updateData.subscriptionStatus = 'TRIAL';
    }

    // Update the user
    const user = await prisma.user.update({
      where: { id: validatedData.userId },
      data: updateData,
    });

    // Determine action type for history
    let action = 'updated';
    if (
      validatedData.subscriptionTier &&
      validatedData.subscriptionTier !== existingUser.subscriptionTier
    ) {
      const tierOrder = { FREE: 0, STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };
      action =
        tierOrder[validatedData.subscriptionTier] > tierOrder[existingUser.subscriptionTier]
          ? 'upgraded'
          : 'downgraded';
    } else if (validatedData.subscriptionStatus === 'CANCELLED') {
      action = 'cancelled';
    } else if (
      validatedData.subscriptionStatus === 'ACTIVE' &&
      existingUser.subscriptionStatus !== 'ACTIVE'
    ) {
      action = 'activated';
    } else if (validatedData.extendTrialDays) {
      action = 'trial_extended';
    }

    // Create subscription history entry
    await prisma.subscriptionHistory.create({
      data: {
        userId: validatedData.userId,
        action,
        fromTier: validatedData.subscriptionTier ? existingUser.subscriptionTier : null,
        toTier: validatedData.subscriptionTier || null,
        fromStatus: validatedData.subscriptionStatus ? existingUser.subscriptionStatus : null,
        toStatus: validatedData.subscriptionStatus || null,
        changedBy: session.user.id,
      },
    });

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'updated',
        entity: 'subscription',
        entityId: validatedData.userId,
        changes: {
          before: {
            subscriptionTier: existingUser.subscriptionTier,
            subscriptionStatus: existingUser.subscriptionStatus,
            subscriptionEndsAt: existingUser.subscriptionEndsAt,
            trialEndsAt: existingUser.trialEndsAt,
          },
          after: updateData,
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
