import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/features/placement', async () => {
  const { z } = await import('zod');

  return {
    completePlacementSchema: z.object({
      leaseStartDate: z.string().min(1),
      leaseEndDate: z.string().nullable().optional(),
      monthlyRent: z.number().positive(),
      depositPaid: z.number().min(0),
      moveInDate: z.string().nullable().optional(),
      unitLabel: z.string().nullable().optional(),
    }),
    placementCompletionService: {
      completePlacement: vi.fn(),
    },
  };
});

import { getServerSession } from 'next-auth';
import { placementCompletionService } from '@/lib/features/placement';
import { NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';
import { POST } from './route';

describe('POST /api/placement/applications/[id]/complete', () => {
  const requestBody = {
    leaseStartDate: '2026-08-01',
    leaseEndDate: '2027-07-31',
    monthlyRent: 14500,
    depositPaid: 14500,
    moveInDate: '2026-08-01',
    unitLabel: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await POST(
      new Request('http://localhost/api/placement/applications/application-1/complete', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }),
      { params: Promise.resolve({ id: 'application-1' }) }
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 for non-agency accounts', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', accountType: 'COMPANY' },
    } as never);

    const response = await POST(
      new Request('http://localhost/api/placement/applications/application-1/complete', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }),
      { params: Promise.resolve({ id: 'application-1' }) }
    );

    expect(response.status).toBe(403);
  });

  it('uses the organization workspace and returns a completed placement', async () => {
    const completed = {
      application: { id: 'application-1', status: 'PLACED', tenantId: 'tenant-1' },
      tenant: {
        id: 'tenant-1',
        firstName: 'Lerato',
        lastName: 'Mokoena',
        email: 'lerato@example.com',
      },
      tenantResolution: 'CREATED',
      portalAccessActive: false,
      nextAction: 'ACTIVATE_PORTAL',
    };
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: 'member-1',
        organizationId: 'agency-1',
        accountType: 'AGENCY',
      },
    } as never);
    vi.mocked(placementCompletionService.completePlacement).mockResolvedValue(completed as never);

    const response = await POST(
      new Request('http://localhost/api/placement/applications/application-1/complete', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }),
      { params: Promise.resolve({ id: 'application-1' }) }
    );

    expect(response.status).toBe(200);
    expect(placementCompletionService.completePlacement).toHaveBeenCalledWith(
      'agency-1',
      'application-1',
      requestBody
    );
    await expect(response.json()).resolves.toEqual(completed);
  });

  it('returns 400 for invalid payloads and business validation failures', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'agency-1', accountType: 'AGENCY' },
    } as never);

    const invalidResponse = await POST(
      new Request('http://localhost/api/placement/applications/application-1/complete', {
        method: 'POST',
        body: JSON.stringify({ ...requestBody, monthlyRent: 0 }),
      }),
      { params: Promise.resolve({ id: 'application-1' }) }
    );

    expect(invalidResponse.status).toBe(400);

    vi.mocked(placementCompletionService.completePlacement).mockRejectedValue(
      new ValidationError('Applicant screening must be passed before placement')
    );

    const validationResponse = await POST(
      new Request('http://localhost/api/placement/applications/application-1/complete', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }),
      { params: Promise.resolve({ id: 'application-1' }) }
    );

    expect(validationResponse.status).toBe(400);
  });

  it('returns 404 when the application is outside the workspace', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'agency-1', accountType: 'AGENCY' },
    } as never);
    vi.mocked(placementCompletionService.completePlacement).mockRejectedValue(
      new NotFoundError('Rental application', 'application-1')
    );

    const response = await POST(
      new Request('http://localhost/api/placement/applications/application-1/complete', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }),
      { params: Promise.resolve({ id: 'application-1' }) }
    );

    expect(response.status).toBe(404);
  });
});
