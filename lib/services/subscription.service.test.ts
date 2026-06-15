import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    payFastSubscription: {
      updateMany: vi.fn(),
    },
    propertyTenant: {
      findMany: vi.fn(),
    },
    subscriptionHistory: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email', () => ({
  emailTemplates: {
    subscriptionCancellationConfirmation: vi.fn(() => ({
      subject: 'Subscription Cancelled',
      html: '<p>cancelled</p>',
      text: 'cancelled',
    })),
    subscriptionCancellationAdminAlert: vi.fn(() => ({
      subject: 'Subscription Cancelled',
      html: '<p>cancelled</p>',
      text: 'cancelled',
    })),
  },
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

import { prisma } from '@/lib/db';
import {
  calculateSubscriptionBilling,
  cancelSubscription,
  getSubscriptionStatus,
  syncSubscriptionStatus,
} from './subscription.service';

describe('calculateSubscriptionBilling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(prisma));
  });

  it('returns a stable unique lease id for each breakdown row when a property has multiple active leases', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      baseSubscriptionFee: 299,
      percentageFee: 4,
      minPropertyFee: 99,
      maxPropertyFee: 999,
      freePropertyCount: 0,
    } as never);

    vi.mocked(prisma.propertyTenant.findMany).mockResolvedValue([
      {
        id: 'lease-1',
        monthlyRent: 5000,
        property: { id: 'property-1', name: 'Shared House' },
        tenant: { firstName: 'Jane', lastName: 'Doe' },
      },
      {
        id: 'lease-2',
        monthlyRent: 6000,
        property: { id: 'property-1', name: 'Shared House' },
        tenant: { firstName: 'John', lastName: 'Smith' },
      },
    ] as never);

    const billing = await calculateSubscriptionBilling('user-1');

    expect(billing.breakdown).toEqual([
      expect.objectContaining({ leaseId: 'lease-1', propertyId: 'property-1' }),
      expect.objectContaining({ leaseId: 'lease-2', propertyId: 'property-1' }),
    ]);
    expect(new Set(billing.breakdown.map((item) => item.leaseId)).size).toBe(
      billing.breakdown.length
    );
  });

  it('keeps the paid tier and property limit active until the subscription end date when cancelled', async () => {
    const subscriptionEndsAt = new Date('2026-07-15T12:00:00.000Z');

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'landlord@example.com',
      firstName: 'Pat',
      lastName: 'Landlord',
      subscriptionTier: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      subscriptionEndsAt,
      propertyLimit: 20,
      freePropertyCount: 2,
      _count: {
        properties: 12,
        propertyTenants: 8,
      },
    } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ email: 'admin@example.com' }] as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(prisma.payFastSubscription.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.subscriptionHistory.create).mockResolvedValue({} as never);

    const cancellation = await cancelSubscription('user-1', 'Too expensive', 'user-1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        subscriptionStatus: 'CANCELLED',
      },
    });
    expect(prisma.user.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionTier: 'FREE',
          propertyLimit: expect.any(Number),
        }),
      })
    );
    expect(cancellation.currentTier).toBe('PROFESSIONAL');
    expect(cancellation.propertyLimit).toBe(20);
    expect(cancellation.downgradeEffectiveAt).toBe(subscriptionEndsAt);
  });

  it('moves an expired cancelled paid subscription to the free tier during subscription sync', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T12:00:00.000Z'));

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      subscriptionTier: 'PROFESSIONAL',
      subscriptionStatus: 'CANCELLED',
      subscriptionEndsAt: new Date('2026-07-15T12:00:00.000Z'),
      payfastSubscription: {
        nextBillingDate: new Date('2026-07-15T12:00:00.000Z'),
      },
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(prisma.subscriptionHistory.create).mockResolvedValue({} as never);

    await syncSubscriptionStatus('user-1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        subscriptionTier: 'FREE',
        propertyLimit: 2,
        freePropertyCount: 2,
      },
    });
    expect(prisma.subscriptionHistory.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: 'SUBSCRIPTION_DOWNGRADED_TO_FREE',
        fromTier: 'PROFESSIONAL',
        toTier: 'FREE',
        fromStatus: 'CANCELLED',
        toStatus: 'CANCELLED',
        reason: 'Cancelled subscription reached the end of the paid access period',
      },
    });

    vi.useRealTimers();
  });

  it('returns billing and expiry dates in subscription status', async () => {
    const subscriptionEndsAt = new Date('2026-07-15T12:00:00.000Z');
    const nextBillingDate = new Date('2026-07-01T12:00:00.000Z');

    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({
        id: 'user-1',
        subscriptionTier: 'PROFESSIONAL',
        subscriptionStatus: 'ACTIVE',
        subscriptionEndsAt,
        payfastSubscription: {
          nextBillingDate,
        },
      } as never)
      .mockResolvedValueOnce({
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt,
        propertyLimit: 20,
        payfastSubscription: {
          nextBillingDate,
        },
      } as never)
      .mockResolvedValueOnce({
        baseSubscriptionFee: 299,
        percentageFee: 4,
        minPropertyFee: 99,
        maxPropertyFee: 999,
        freePropertyCount: 2,
      } as never);
    vi.mocked(prisma.propertyTenant.findMany).mockResolvedValue([] as never);

    const status = await getSubscriptionStatus('user-1');

    expect(status.subscriptionEndsAt).toBe(subscriptionEndsAt);
    expect(status.nextBillingDate).toBe(nextBillingDate);
  });
});
