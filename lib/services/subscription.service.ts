import { prisma } from '@/lib/db';

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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
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

  return {
    isOnTrial,
    trialEndsAt,
    trialDaysRemaining,
    subscriptionStatus: user.subscriptionStatus,
    restrictionLevel: level,
    restrictionMessage: message,
    canAddProperties: level === RestrictionLevel.NONE || level === RestrictionLevel.WARNING,
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
