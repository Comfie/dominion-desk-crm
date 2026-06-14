import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn(),
    },
    maintenanceRequest: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/notifications', () => ({
  notifyMaintenanceRequest: vi.fn(),
}));

vi.mock('@/lib/tenant-session', () => ({
  getTenantForPortalSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { notifyMaintenanceRequest } from '@/lib/notifications';
import { getTenantForPortalSession } from '@/lib/tenant-session';
import { POST } from './route';

describe('POST /api/portal/maintenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: 'tenant-user-123',
        email: 'tenant@example.com',
        accountType: 'TENANT',
      },
    } as never);

    vi.mocked(getTenantForPortalSession).mockResolvedValue({
      id: 'tenant-123',
    } as never);

    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      id: 'tenant-123',
      userId: 'landlord-123',
      firstName: 'Jane',
      lastName: 'Tenant',
      properties: [
        {
          propertyId: 'property-123',
          property: {
            name: 'Oak House',
            userId: 'landlord-123',
          },
        },
      ],
    } as never);

    vi.mocked(prisma.maintenanceRequest.create).mockResolvedValue({
      id: 'maintenance-123',
    } as never);

    vi.mocked(notifyMaintenanceRequest).mockResolvedValue(undefined as never);
  });

  it('persists uploaded image metadata on the maintenance request', async () => {
    const images = [
      {
        url: 'https://files.example.com/leak.jpg',
        name: 'leak.jpg',
        size: 2048,
        type: 'image/jpeg',
      },
    ];

    const response = await POST(
      new Request('http://localhost/api/portal/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Leaking kitchen sink',
          description: 'Water is leaking under the kitchen sink and damaging the cupboard.',
          category: 'PLUMBING',
          priority: 'NORMAL',
          images,
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(prisma.maintenanceRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          propertyId: 'property-123',
          userId: 'landlord-123',
          tenantId: 'tenant-123',
          images,
        }),
      })
    );
  });
});
