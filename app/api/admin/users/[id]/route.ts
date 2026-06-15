import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/auth-helpers';
import prisma from '@/lib/db';
import { getPropertyLimitForTier } from '@/lib/services/subscription.service';

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  accountType: z.enum(['INDIVIDUAL', 'COMPANY', 'AGENCY']).optional(),
  subscriptionTier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  subscriptionStatus: z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED']).optional(),
  subscriptionEndsAt: z.string().optional().nullable(),
  trialEndsAt: z.string().optional().nullable(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('[User Details API] Starting request...');
    const session = await requireSuperAdmin();
    console.log('[User Details API] Session verified:', session.user.id);

    const { id } = await params;
    console.log('[User Details API] Fetching user with ID:', id);

    // First find the user
    const user = await prisma.user.findUnique({
      where: {
        id,
        role: 'CUSTOMER', // Only allow viewing CUSTOMER users
      },
      include: {
        _count: {
          select: {
            properties: true,
            bookings: true,
            tenants: true,
            payments: true,
            maintenanceRequests: true,
          },
        },
        properties: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            propertyType: true,
            status: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    console.log('[User Details API] User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('[User Details API] User not found with ID:', id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[User Details API] Fetching subscription history...');
    // Fetch subscription history separately
    const subscriptionHistory = await prisma.subscriptionHistory.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    console.log('[User Details API] Subscription history count:', subscriptionHistory.length);

    // Calculate MRR
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

    console.log('[User Details API] Returning user data successfully');
    return NextResponse.json({
      ...user,
      mrr,
      subscriptionHistory,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      console.log('[User Details API] Returning NextResponse error');
      return error;
    }
    console.error('[User Details API] Error fetching user:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('[User Details API] Error message:', error.message);
      console.error('[User Details API] Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        error: 'Failed to fetch user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Verify user exists and is a CUSTOMER
    const existingUser = await prisma.user.findUnique({
      where: { id, role: 'CUSTOMER' },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user
    const updateData: any = {};

    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    if (validatedData.accountType) {
      updateData.accountType = validatedData.accountType;
    }

    if (validatedData.subscriptionTier) {
      updateData.subscriptionTier = validatedData.subscriptionTier;
      updateData.propertyLimit = getPropertyLimitForTier(validatedData.subscriptionTier);
    }

    if (validatedData.subscriptionStatus) {
      updateData.subscriptionStatus = validatedData.subscriptionStatus;
    }

    if (validatedData.subscriptionEndsAt !== undefined) {
      updateData.subscriptionEndsAt = validatedData.subscriptionEndsAt
        ? new Date(validatedData.subscriptionEndsAt)
        : null;
    }

    if (validatedData.trialEndsAt !== undefined) {
      updateData.trialEndsAt = validatedData.trialEndsAt
        ? new Date(validatedData.trialEndsAt)
        : null;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'updated',
        entity: 'user',
        entityId: id,
        changes: {
          before: {
            isActive: existingUser.isActive,
            accountType: existingUser.accountType,
            subscriptionTier: existingUser.subscriptionTier,
            subscriptionStatus: existingUser.subscriptionStatus,
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
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
