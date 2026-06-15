import { prisma } from '@/lib/db';
import { emailTemplates, sendEmail } from '@/lib/email';

export const FREE_TIER_PROPERTY_LIMIT = 2;

export function getPropertyLimitForTier(tier: string): number {
  switch (tier) {
    case 'FREE':
      return FREE_TIER_PROPERTY_LIMIT;
    case 'STARTER':
      return 5;
    case 'PROFESSIONAL':
      return 20;
    case 'ENTERPRISE':
      return 999999;
    default:
      return FREE_TIER_PROPERTY_LIMIT;
  }
}

export interface SubscriptionCancellationResult {
  status: 'CANCELLED';
  previousTier: string;
  currentTier: string;
  scheduledDowngradeTier: 'FREE';
  propertyLimit: number;
  freeTierPropertyLimit: number;
  propertyCount: number;
  activePropertyCount: number;
  propertiesAboveFreeTierCount: number;
  cancelledAt: Date;
  accessUntil: Date | null;
  downgradeEffectiveAt: Date | null;
  emails: {
    userConfirmationSent: boolean;
    adminNotificationSent: boolean;
    adminRecipientCount: number;
  };
}

function getUserDisplayName(user: { firstName: string; lastName: string; email: string }): string {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg',
  }).format(value);
}

async function getSuperAdminNotificationEmails(): Promise<string[]> {
  const superAdmins = await prisma.user.findMany({
    where: {
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    select: {
      email: true,
    },
  });

  const recipients = new Set<string>();
  superAdmins.forEach((admin) => recipients.add(admin.email));

  if (process.env.OWNER_EMAIL) {
    recipients.add(process.env.OWNER_EMAIL);
  }

  return Array.from(recipients);
}

/**
 * Subscription restriction levels based on days after trial expiry
 */
export enum RestrictionLevel {
  NONE = 'NONE', // Active subscription or within trial
  WARNING = 'WARNING', // 0-7 days after trial expiry
  LIMITED = 'LIMITED', // 8-14 days after trial expiry
  READONLY = 'READONLY', // 15-30 days after trial expiry
  SUSPENDED = 'SUSPENDED', // 30+ days after trial expiry
}

export interface PropertyBillingItem {
  leaseId: string;
  propertyId: string;
  propertyName: string;
  tenantName: string;
  monthlyRent: number;
  calculatedFee: number;
  actualFee: number;
  isFreeProperty: boolean;
}

export interface SubscriptionCalculation {
  baseFee: number;
  totalPropertyFees: number;
  totalMonthlyFee: number;
  activePropertyCount: number;
  freePropertyCount: number;
  chargeablePropertyCount: number;
  breakdown: PropertyBillingItem[];
}

export interface SubscriptionStatus {
  isOnTrial: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number | null;
  subscriptionEndsAt: Date | null;
  nextBillingDate: Date | null;
  subscriptionStatus: string;
  restrictionLevel: RestrictionLevel;
  restrictionMessage: string | null;
  canAddProperties: boolean;
  canCreateBookings: boolean;
  canEditData: boolean;
  currentBilling: SubscriptionCalculation;
}

/**
 * Calculate restriction level based on trial expiry
 */
export function calculateRestrictionLevel(
  trialEndsAt: Date | null,
  subscriptionStatus: string
): {
  level: RestrictionLevel;
  message: string | null;
} {
  // Active subscription = no restrictions
  if (subscriptionStatus === 'ACTIVE') {
    return { level: RestrictionLevel.NONE, message: null };
  }

  // If no trial end date set, treat as within trial
  if (!trialEndsAt) {
    return { level: RestrictionLevel.NONE, message: null };
  }

  const now = new Date();
  const daysAfterExpiry = Math.floor(
    (now.getTime() - trialEndsAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Still within trial
  if (daysAfterExpiry < 0) {
    return { level: RestrictionLevel.NONE, message: null };
  }

  // 0-7 days: Warning
  if (daysAfterExpiry <= 7) {
    return {
      level: RestrictionLevel.WARNING,
      message: `Your trial has expired. Subscribe within ${7 - daysAfterExpiry} days to maintain full access.`,
    };
  }

  // 8-14 days: Limited
  if (daysAfterExpiry <= 14) {
    return {
      level: RestrictionLevel.LIMITED,
      message:
        'Your trial has expired. You cannot add new properties or bookings. Subscribe to restore full access.',
    };
  }

  // 15-30 days: Read-only
  if (daysAfterExpiry <= 30) {
    return {
      level: RestrictionLevel.READONLY,
      message: 'Your account is in read-only mode. Subscribe to resume normal operations.',
    };
  }

  // 30+ days: Suspended
  return {
    level: RestrictionLevel.SUSPENDED,
    message: 'Your account has been suspended. Please subscribe to reactivate your account.',
  };
}

/**
 * Calculate subscription fee for a single property
 */
export function calculatePropertyFee(
  monthlyRent: number,
  percentageFee: number = 4.0,
  minFee: number = 99,
  maxFee: number = 999
): { calculated: number; actual: number } {
  const rent = Number(monthlyRent);
  const percentage = Number(percentageFee) / 100;
  const min = Number(minFee);
  const max = Number(maxFee);

  const calculated = rent * percentage;
  const actual = Math.min(Math.max(calculated, min), max);

  return { calculated, actual };
}

/**
 * Calculate complete subscription billing for a user
 */
export async function calculateSubscriptionBilling(
  userId: string
): Promise<SubscriptionCalculation> {
  // Get user's subscription settings
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      baseSubscriptionFee: true,
      percentageFee: true,
      minPropertyFee: true,
      maxPropertyFee: true,
      freePropertyCount: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const baseFee = Number(user.baseSubscriptionFee);
  const freeCount = user.freePropertyCount;

  // Get all active property-tenant relationships with rent
  const activeLeases = await prisma.propertyTenant.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
      tenant: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc', // Oldest first so we know which are "free"
    },
  });

  const breakdown: PropertyBillingItem[] = [];
  let totalPropertyFees = 0;

  activeLeases.forEach((lease, index) => {
    const isFreeProperty = index < freeCount;
    const monthlyRent = Number(lease.monthlyRent);

    let calculatedFee = 0;
    let actualFee = 0;

    if (!isFreeProperty) {
      const fees = calculatePropertyFee(
        monthlyRent,
        Number(user.percentageFee),
        Number(user.minPropertyFee),
        Number(user.maxPropertyFee)
      );
      calculatedFee = fees.calculated;
      actualFee = fees.actual;
      totalPropertyFees += actualFee;
    }

    breakdown.push({
      leaseId: lease.id,
      propertyId: lease.property.id,
      propertyName: lease.property.name,
      tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
      monthlyRent,
      calculatedFee,
      actualFee,
      isFreeProperty,
    });
  });

  return {
    baseFee,
    totalPropertyFees,
    totalMonthlyFee: baseFee + totalPropertyFees,
    activePropertyCount: activeLeases.length,
    freePropertyCount: Math.min(freeCount, activeLeases.length),
    chargeablePropertyCount: Math.max(0, activeLeases.length - freeCount),
    breakdown,
  };
}

/**
 * Get complete subscription status for a user
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  await syncSubscriptionStatus(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
      propertyLimit: true,
      payfastSubscription: {
        select: {
          nextBillingDate: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isOnTrial = user.subscriptionStatus === 'TRIAL';
  const trialEndsAt = user.trialEndsAt;

  let trialDaysRemaining: number | null = null;
  if (isOnTrial && trialEndsAt) {
    const now = new Date();
    const remaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    trialDaysRemaining = Math.max(0, remaining);
  }

  const { level, message } = calculateRestrictionLevel(trialEndsAt, user.subscriptionStatus);
  const currentBilling = await calculateSubscriptionBilling(userId);

  // Check if user can add properties based on restriction level
  let canAddProperties = level === RestrictionLevel.NONE || level === RestrictionLevel.WARNING;
  let restrictionMessage = message;

  // Check property count limits for non-active subscribers
  if (canAddProperties && user.subscriptionStatus !== 'ACTIVE') {
    const propertyCount = await prisma.property.count({
      where: { userId },
    });

    // Trial users are limited to 2 properties
    if (isOnTrial && propertyCount >= 2) {
      canAddProperties = false;
      restrictionMessage =
        'You can add up to 2 properties during your free trial. Subscribe to add more properties.';
    }
    // Non-subscribed users are limited by their propertyLimit
    else if (propertyCount >= user.propertyLimit) {
      canAddProperties = false;
      restrictionMessage = `You have reached your property limit (${user.propertyLimit}). Please subscribe to add more properties.`;
    }
  }

  return {
    isOnTrial,
    trialEndsAt,
    trialDaysRemaining,
    subscriptionEndsAt: user.subscriptionEndsAt,
    nextBillingDate: user.payfastSubscription?.nextBillingDate || null,
    subscriptionStatus: user.subscriptionStatus,
    restrictionLevel: level,
    restrictionMessage,
    canAddProperties,
    canCreateBookings: level === RestrictionLevel.NONE || level === RestrictionLevel.WARNING,
    canEditData: level !== RestrictionLevel.READONLY && level !== RestrictionLevel.SUSPENDED,
    currentBilling,
  };
}

/**
 * Check if a user can add more properties
 */
export async function canAddProperty(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const status = await getSubscriptionStatus(userId);

  // Check restriction level
  if (!status.canAddProperties) {
    return {
      allowed: false,
      reason: status.restrictionMessage || 'You cannot add properties at this time.',
    };
  }

  // Get current property count
  const propertyCount = await prisma.property.count({
    where: { userId },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      propertyLimit: true,
      subscriptionStatus: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  // For users still in trial without active subscription
  if (status.isOnTrial) {
    if (propertyCount >= 2) {
      return {
        allowed: false,
        reason:
          'You can add up to 2 properties during your free trial. Subscribe to add more properties.',
      };
    }
  }

  // Check property limit for non-subscribed users
  if (user.subscriptionStatus !== 'ACTIVE' && propertyCount >= user.propertyLimit) {
    return {
      allowed: false,
      reason: `You have reached your property limit (${user.propertyLimit}). Please subscribe to add more properties.`,
    };
  }

  return { allowed: true };
}

/**
 * Activate subscription after successful PayFast payment
 * Updates user status, creates subscription history, and sets next billing date
 */
export async function activateSubscription(
  userId: string,
  payfastData: {
    token?: string;
    subscriptionId?: string;
    merchantReference: string;
    amount: number;
  }
): Promise<void> {
  const now = new Date();
  const nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // Update user subscription status
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionEndsAt: nextBillingDate,
    },
  });

  // Update PayFast subscription record
  await prisma.payFastSubscription.update({
    where: { merchantReference: payfastData.merchantReference },
    data: {
      status: 'ACTIVE',
      payfastToken: payfastData.token,
      payfastSubscriptionId: payfastData.subscriptionId,
      startDate: now,
      nextBillingDate,
      lastBillingDate: now,
    },
  });

  // Create subscription history entry
  await prisma.subscriptionHistory.create({
    data: {
      userId,
      action: 'SUBSCRIPTION_ACTIVATED',
      fromStatus: 'TRIAL',
      toStatus: 'ACTIVE',
      fromTier: 'FREE',
      toTier: 'FREE',
      reason: `Subscription activated via PayFast. Reference: ${payfastData.merchantReference}`,
    },
  });
}

/**
 * Handle failed payment for subscription
 * Updates subscription status and sends notifications
 */
export async function handleFailedPayment(userId: string, reason?: string): Promise<void> {
  // Update user subscription status to PAST_DUE
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  });

  // Update PayFast subscription status
  const payfastSub = await prisma.payFastSubscription.findUnique({
    where: { userId },
  });

  if (payfastSub) {
    await prisma.payFastSubscription.update({
      where: { userId },
      data: {
        status: 'SUSPENDED',
      },
    });
  }

  // Create subscription history entry
  await prisma.subscriptionHistory.create({
    data: {
      userId,
      action: 'PAYMENT_FAILED',
      fromStatus: 'ACTIVE',
      toStatus: 'PAST_DUE',
      reason: reason || 'Payment failed',
    },
  });

  // TODO: Send email notification to user about failed payment
}

/**
 * Cancel subscription
 * Cancels paid billing and moves the account back to the free tier.
 */
export async function cancelSubscription(
  userId: string,
  reason?: string,
  cancelledBy?: string
): Promise<SubscriptionCancellationResult> {
  const cancelledAt = new Date();
  const freePropertyLimit = getPropertyLimitForTier('FREE');
  const cancellationReason = reason || 'Subscription cancelled by user';

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      propertyLimit: true,
      _count: {
        select: {
          properties: true,
          propertyTenants: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const propertyCount = user._count.properties;
  const activePropertyCount = user._count.propertyTenants;
  const propertiesAboveFreeTierCount = Math.max(0, propertyCount - freePropertyLimit);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'CANCELLED',
      },
    });

    await tx.payFastSubscription.updateMany({
      where: { userId },
      data: {
        status: 'CANCELLED',
        cancelledAt,
      },
    });

    await tx.subscriptionHistory.create({
      data: {
        userId,
        action: 'SUBSCRIPTION_CANCELLED',
        fromStatus: user.subscriptionStatus,
        toStatus: 'CANCELLED',
        fromTier: user.subscriptionTier,
        toTier: user.subscriptionTier,
        changedBy: cancelledBy,
        reason: cancellationReason,
      },
    });
  });

  const recipientName = getUserDisplayName(user);
  const cancelledAtFormatted = formatDateTime(cancelledAt);
  const accessUntilFormatted = user.subscriptionEndsAt
    ? formatDateTime(user.subscriptionEndsAt)
    : null;
  const userEmail = emailTemplates.subscriptionCancellationConfirmation({
    recipientName,
    cancelledAt: cancelledAtFormatted,
    reason: cancellationReason,
    previousTier: user.subscriptionTier,
    newTier: user.subscriptionTier,
    propertyLimit: user.propertyLimit,
    freeTierPropertyLimit: freePropertyLimit,
    propertyCount,
    chargeablePropertyCount: propertiesAboveFreeTierCount,
    accessUntil: accessUntilFormatted,
  });

  const adminRecipients = await getSuperAdminNotificationEmails();
  const adminEmail =
    adminRecipients.length > 0
      ? emailTemplates.subscriptionCancellationAdminAlert({
          userName: recipientName,
          userEmail: user.email,
          cancelledAt: cancelledAtFormatted,
          reason: cancellationReason,
          previousTier: user.subscriptionTier,
          newTier: user.subscriptionTier,
          propertyLimit: user.propertyLimit,
          freeTierPropertyLimit: freePropertyLimit,
          propertyCount,
          activePropertyCount,
          chargeablePropertyCount: propertiesAboveFreeTierCount,
          cancelledBy: cancelledBy || userId,
          accessUntil: accessUntilFormatted,
        })
      : null;

  const [userEmailResult, adminEmailResult] = await Promise.all([
    sendEmail({
      to: user.email,
      subject: userEmail.subject,
      html: userEmail.html,
      text: userEmail.text,
    }),
    adminEmail
      ? sendEmail({
          to: adminRecipients,
          subject: adminEmail.subject,
          html: adminEmail.html,
          text: adminEmail.text,
        })
      : Promise.resolve<{ success: boolean; messageId?: string; error?: string }>({
          success: false,
        }),
  ]);

  if (!userEmailResult.success) {
    console.error('Failed to send subscription cancellation confirmation email', {
      userId,
      error: userEmailResult.error,
    });
  }

  if (adminEmail && !adminEmailResult.success) {
    console.error('Failed to send subscription cancellation admin notification email', {
      userId,
      recipients: adminRecipients,
      error: adminEmailResult.error,
    });
  }

  return {
    status: 'CANCELLED',
    previousTier: user.subscriptionTier,
    currentTier: user.subscriptionTier,
    scheduledDowngradeTier: 'FREE',
    propertyLimit: user.propertyLimit,
    freeTierPropertyLimit: freePropertyLimit,
    propertyCount,
    activePropertyCount,
    propertiesAboveFreeTierCount,
    cancelledAt,
    accessUntil: user.subscriptionEndsAt,
    downgradeEffectiveAt: user.subscriptionEndsAt,
    emails: {
      userConfirmationSent: userEmailResult.success,
      adminNotificationSent: adminEmailResult.success,
      adminRecipientCount: adminRecipients.length,
    },
  };
}

/**
 * Check and sync subscription status with PayFast
 * Called by cron job to keep status in sync
 */
export async function syncSubscriptionStatus(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      payfastSubscription: true,
    },
  });

  if (!user) {
    return;
  }

  const now = new Date();

  if (
    user.subscriptionStatus === 'CANCELLED' &&
    user.subscriptionTier !== 'FREE' &&
    user.subscriptionEndsAt &&
    user.subscriptionEndsAt <= now
  ) {
    const freePropertyLimit = getPropertyLimitForTier('FREE');

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'FREE',
        propertyLimit: freePropertyLimit,
        freePropertyCount: freePropertyLimit,
      },
    });

    await prisma.subscriptionHistory.create({
      data: {
        userId,
        action: 'SUBSCRIPTION_DOWNGRADED_TO_FREE',
        fromTier: user.subscriptionTier,
        toTier: 'FREE',
        fromStatus: user.subscriptionStatus,
        toStatus: user.subscriptionStatus,
        reason: 'Cancelled subscription reached the end of the paid access period',
      },
    });

    return;
  }

  if (!user.payfastSubscription) {
    return;
  }

  const nextBillingDate = user.payfastSubscription.nextBillingDate;

  // If past billing date and status is still ACTIVE, check for payment
  if (nextBillingDate && nextBillingDate < now && user.subscriptionStatus === 'ACTIVE') {
    // Check if payment was received for this billing period
    const recentPayment = await prisma.payFastTransaction.findFirst({
      where: {
        userId,
        paymentStatus: 'COMPLETE',
        createdAt: {
          gte: new Date(nextBillingDate.getTime() - 24 * 60 * 60 * 1000), // Within 24h of billing date
        },
      },
    });

    if (!recentPayment) {
      // No payment received, mark as PAST_DUE
      await handleFailedPayment(userId, 'Payment not received for billing period');
    }
  }
}
