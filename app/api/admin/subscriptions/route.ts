import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/auth-helpers';
import prisma from '@/lib/db';
import { calculateSubscriptionBilling } from '@/lib/services/subscription.service';

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const paymentStatus = searchParams.get('paymentStatus'); // CURRENT, OVERDUE, DUE_SOON, TRIAL_EXPIRED

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
        { companyName: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          propertyLimit: true,
          baseSubscriptionFee: true,
          freePropertyCount: true,
          createdAt: true,
          updatedAt: true,
          payfastSubscription: {
            select: {
              id: true,
              status: true,
              amount: true,
              merchantReference: true,
              nextBillingDate: true,
              lastBillingDate: true,
              startDate: true,
              cancelledAt: true,
              createdAt: true,
            },
          },
          billingInvoices: {
            select: {
              id: true,
              invoiceNumber: true,
              periodStart: true,
              periodEnd: true,
              baseFee: true,
              propertyFees: true,
              totalAmount: true,
              status: true,
              paidAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10, // Last 10 invoices
          },
          _count: {
            select: {
              properties: true,
              propertyTenants: {
                where: { isActive: true },
              },
              billingInvoices: true,
            },
          },
        },
        orderBy:
          sortBy === 'subscriptionEndsAt' ? { subscriptionEndsAt: 'asc' } : { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate MRR and payment status for each user
    const subscriptions = await Promise.all(
      users.map(async (user) => {
        let mrr = 0;
        let estimatedBilling: any = null;
        const now = new Date();
        let calculatedPaymentStatus = 'CURRENT';
        let daysOverdue = 0;
        let daysUntilDue = null;

        // Calculate subscription billing
        if (user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'TRIAL') {
          try {
            const billing = await calculateSubscriptionBilling(user.id);
            mrr = billing.totalMonthlyFee;
            estimatedBilling = billing;
          } catch {
            mrr = Number(user.baseSubscriptionFee);
          }
        }

        // Calculate payment status
        if (user.subscriptionEndsAt && user.subscriptionEndsAt < now) {
          daysOverdue = Math.floor(
            (now.getTime() - user.subscriptionEndsAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (user.subscriptionStatus === 'PAST_DUE') {
            calculatedPaymentStatus = 'OVERDUE';
          } else if (user.subscriptionStatus === 'TRIAL') {
            calculatedPaymentStatus = 'TRIAL_EXPIRED';
          }
        }

        // Check for upcoming payment
        if (
          user.payfastSubscription?.nextBillingDate &&
          user.payfastSubscription.nextBillingDate > now
        ) {
          daysUntilDue = Math.floor(
            (user.payfastSubscription.nextBillingDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (daysUntilDue <= 7 && user.subscriptionStatus === 'ACTIVE') {
            calculatedPaymentStatus = 'DUE_SOON';
          }
        }

        // Calculate total revenue from this landlord
        const totalRevenue = user.billingInvoices
          .filter((inv) => inv.status === 'PAID')
          .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

        // Get last payment
        const lastPayment = user.billingInvoices.find((inv) => inv.status === 'PAID');

        // Count failed payments
        const failedPayments = user.billingInvoices.filter((inv) => inv.status === 'FAILED').length;

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          trialEndsAt: user.trialEndsAt,
          subscriptionEndsAt: user.subscriptionEndsAt,
          propertyCount: user._count.properties,
          activePropertyCount: user._count.propertyTenants,
          freePropertyCount: user.freePropertyCount,
          invoiceCount: user._count.billingInvoices,
          mrr,
          estimatedBilling,
          nextBillingDate: user.payfastSubscription?.nextBillingDate || user.subscriptionEndsAt,
          lastBillingDate: user.payfastSubscription?.lastBillingDate,
          payfastSubscription: user.payfastSubscription,
          recentInvoices: user.billingInvoices,
          paymentStatus: calculatedPaymentStatus,
          daysOverdue,
          daysUntilDue,
          totalRevenue,
          lastPayment,
          failedPayments,
          createdAt: user.createdAt,
        };
      })
    );

    // Filter by payment status if specified
    let filteredSubscriptions = subscriptions;
    if (paymentStatus) {
      filteredSubscriptions = subscriptions.filter((sub) => sub.paymentStatus === paymentStatus);
    }

    // Calculate summary statistics
    const summary = {
      totalLandlords: total,
      activeSubscriptions: await prisma.user.count({
        where: { role: 'CUSTOMER', subscriptionStatus: 'ACTIVE' },
      }),
      trialUsers: await prisma.user.count({
        where: { role: 'CUSTOMER', subscriptionStatus: 'TRIAL' },
      }),
      overduePayments: subscriptions.filter((sub) => sub.paymentStatus === 'OVERDUE').length,
      trialExpired: subscriptions.filter((sub) => sub.paymentStatus === 'TRIAL_EXPIRED').length,
      dueSoon: subscriptions.filter((sub) => sub.paymentStatus === 'DUE_SOON').length,
      cancelledSubscriptions: await prisma.user.count({
        where: { role: 'CUSTOMER', subscriptionStatus: 'CANCELLED' },
      }),
      totalMRR: subscriptions.reduce((sum, sub) => sum + sub.mrr, 0),
      totalRevenue: subscriptions.reduce((sum, sub) => sum + sub.totalRevenue, 0),
    };

    return NextResponse.json({
      subscriptions: filteredSubscriptions,
      summary,
      pagination: {
        page,
        limit,
        total: paymentStatus ? filteredSubscriptions.length : total,
        totalPages: Math.ceil((paymentStatus ? filteredSubscriptions.length : total) / limit),
      },
    });
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
      return NextResponse.json({ error: 'Landlord not found' }, { status: 404 });
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
