import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services/system-settings.service', () => ({
  getSubscriptionSettings: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { getSubscriptionSettings } from '@/lib/services/system-settings.service';
import { POST } from './route';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('fetch', vi.fn());

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-123',
      email: 'local-register@example.com',
      firstName: 'Local',
      lastName: 'Tester',
    } as never);
    vi.mocked(getSubscriptionSettings).mockResolvedValue({
      trialDays: 60,
      trialPropertyLimit: 2,
      baseFee: 0,
      percentageFee: 0,
      minPropertyFee: 0,
      maxPropertyFee: 0,
      freePropertyCount: 2,
      gracePeriodWarningDays: 7,
      gracePeriodLimitedDays: 14,
      gracePeriodReadonlyDays: 21,
    });
  });

  it('allows localhost development registration without calling external reCAPTCHA', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Local',
          lastName: 'Tester',
          email: 'local-register@example.com',
          password: 'Password123',
          phone: '',
          recaptchaToken: 'local-development',
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'local-register@example.com',
          subscriptionStatus: 'TRIAL',
        }),
      })
    );
  });
});
