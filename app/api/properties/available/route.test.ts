import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    property: {
      findMany: vi.fn(),
    },
  },
  default: {
    property: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';
import { GET } from './route';

describe('GET /api/properties/available', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as never);
  });

  it('returns long-term properties without active leases for tenant assignment even when manually marked unavailable', async () => {
    const manuallyUnavailableProperty = {
      id: 'property-123',
      name: 'Long Term Home',
      address: '123 Test Street',
      city: 'Cape Town',
      province: 'Western Cape',
      propertyType: 'HOUSE',
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 1,
      rentalType: 'LONG_TERM',
      monthlyRent: 12000,
      dailyRate: null,
      securityDeposit: 12000,
      allowsMultipleTenants: false,
      tenants: [],
      bookings: [],
    };

    vi.mocked(prisma.property.findMany).mockImplementation((async (args) => {
      if (args?.where && 'isAvailable' in args.where) {
        return [];
      }

      return [manuallyUnavailableProperty] as never;
    }) as typeof prisma.property.findMany);

    const response = await GET(
      new Request('http://localhost/api/properties/available?purpose=tenant')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: 'property-123',
        name: 'Long Term Home',
        rentalType: 'LONG_TERM',
        activeTenantsCount: 0,
      }),
    ]);
  });

  it('does not treat expired lease rows as active tenant assignments', async () => {
    const singleTenantPropertyWithExpiredLease = {
      id: 'property-456',
      name: 'Single Tenant Home',
      address: '456 Test Street',
      city: 'Johannesburg',
      province: 'Gauteng',
      propertyType: 'HOUSE',
      bedrooms: 2,
      bathrooms: 1,
      parkingSpaces: 1,
      rentalType: 'LONG_TERM',
      monthlyRent: 9000,
      dailyRate: null,
      securityDeposit: 9000,
      allowsMultipleTenants: false,
      tenants: [
        {
          id: 'lease-123',
          leaseStartDate: new Date('2025-01-01'),
          leaseEndDate: new Date('2025-12-31'),
          unitLabel: null,
        },
      ],
      bookings: [],
    };

    vi.mocked(prisma.property.findMany).mockResolvedValue([
      singleTenantPropertyWithExpiredLease,
    ] as never);

    const response = await GET(
      new Request('http://localhost/api/properties/available?purpose=tenant')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: 'property-456',
        name: 'Single Tenant Home',
        activeTenantsCount: 0,
      }),
    ]);
  });
});
