import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/features/properties', () => ({
  propertyService: {
    list: vi.fn(),
  },
}));

import { getServerSession } from 'next-auth';
import { propertyService } from '@/lib/features/properties';
import { GET } from './route';

describe('GET /api/properties/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as never);
  });

  it('returns all matching properties for the current filters', async () => {
    vi.mocked(propertyService.list).mockResolvedValue([
      {
        id: 'property-1',
        name: 'Oak House',
        status: 'ACTIVE',
        rentalType: 'LONG_TERM',
        allowsMultipleTenants: true,
        securityDeposit: 12000,
        hasActiveTenant: true,
      },
      {
        id: 'property-2',
        name: 'Beech House',
        status: 'ACTIVE',
        rentalType: 'LONG_TERM',
        allowsMultipleTenants: false,
        securityDeposit: 8000,
        hasActiveTenant: false,
      },
    ] as never);

    const response = await GET(
      new Request(
        'http://localhost/api/properties/export?search=oak&status=ACTIVE&type=LONG_TERM&occupied=true'
      )
    );

    expect(response.status).toBe(200);
    expect(propertyService.list).toHaveBeenCalledWith('user-123', {
      status: 'ACTIVE',
      rentalType: 'LONG_TERM',
      search: 'oak',
    });
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        count: 1,
        properties: [expect.objectContaining({ name: 'Oak House' })],
      })
    );
  });
});
