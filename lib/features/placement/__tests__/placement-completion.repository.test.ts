import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/lib/db';
import { ValidationError } from '@/lib/shared/errors/app-error';
import type { CompletePlacementDTO } from '../dtos/placement-completion.dto';
import { PlacementCompletionRepository } from '../repositories/placement-completion.repository';

vi.mock('@/lib/db', () => ({
  prisma: {
    rentalApplication: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('PlacementCompletionRepository', () => {
  const userId = 'agency-1';
  const applicationId = 'application-1';
  const data: CompletePlacementDTO = {
    leaseStartDate: '2026-08-01',
    leaseEndDate: '2027-07-31',
    monthlyRent: 14500,
    depositPaid: 14500,
    moveInDate: '2026-08-01',
    unitLabel: null,
  };

  const baseApplication = {
    id: applicationId,
    userId,
    tenantId: null,
    applicantFirstName: 'Lerato',
    applicantLastName: 'Mokoena',
    applicantEmail: 'Lerato@Example.com',
    applicantPhone: '0821234567',
    idNumber: '9001010000000',
    status: 'APPROVED',
    screening: {
      overallStatus: 'PASSED',
      declaredMonthlyIncome: 45000,
    },
    tenant: null,
    property: {
      id: 'property-1',
      allowsMultipleTenants: false,
      tenants: [],
    },
  };

  const makeTransaction = () => ({
    rentalApplication: {
      findFirst: vi.fn().mockResolvedValue(baseApplication),
      update: vi.fn().mockResolvedValue({
        id: applicationId,
        status: 'PLACED',
        tenantId: 'tenant-1',
      }),
    },
    tenant: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'tenant-1',
        firstName: 'Lerato',
        lastName: 'Mokoena',
        email: 'Lerato@Example.com',
        portalUserId: null,
      }),
    },
    propertyTenant: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'lease-1' }),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reuses a tenant explicitly linked to the application', async () => {
    const transaction = makeTransaction();
    transaction.rentalApplication.findFirst.mockResolvedValue({
      ...baseApplication,
      tenantId: 'tenant-linked',
      tenant: {
        id: 'tenant-linked',
        userId,
        firstName: 'Lerato',
        lastName: 'Mokoena',
        email: 'lerato@example.com',
        portalUserId: 'portal-1',
      },
    });
    transaction.rentalApplication.update.mockResolvedValue({
      id: applicationId,
      status: 'PLACED',
      tenantId: 'tenant-linked',
    });
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(transaction as never)
    );

    const result = await new PlacementCompletionRepository().complete(userId, applicationId, data);

    expect(transaction.tenant.findFirst).not.toHaveBeenCalled();
    expect(transaction.tenant.create).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        tenantResolution: 'LINKED',
        portalAccessActive: true,
        nextAction: null,
      })
    );
  });

  it('reuses a workspace tenant by case-insensitive email', async () => {
    const transaction = makeTransaction();
    transaction.tenant.findFirst.mockResolvedValue({
      id: 'tenant-existing',
      userId,
      firstName: 'Lerato',
      lastName: 'Mokoena',
      email: 'lerato@example.com',
      portalUserId: null,
    });
    transaction.rentalApplication.update.mockResolvedValue({
      id: applicationId,
      status: 'PLACED',
      tenantId: 'tenant-existing',
    });
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(transaction as never)
    );

    const result = await new PlacementCompletionRepository().complete(userId, applicationId, data);

    expect(transaction.tenant.findFirst).toHaveBeenCalledWith({
      where: {
        userId,
        email: { equals: 'Lerato@Example.com', mode: 'insensitive' },
      },
      select: expect.any(Object),
    });
    expect(transaction.tenant.create).not.toHaveBeenCalled();
    expect(result.tenantResolution).toBe('EMAIL_MATCH');
    expect(result.nextAction).toBe('ACTIVATE_PORTAL');
  });

  it('creates a long-term tenant and copies screening income when no tenant matches', async () => {
    const transaction = makeTransaction();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(transaction as never)
    );

    const result = await new PlacementCompletionRepository().complete(userId, applicationId, data);

    expect(transaction.tenant.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        firstName: 'Lerato',
        lastName: 'Mokoena',
        email: 'Lerato@Example.com',
        phone: '0821234567',
        idNumber: '9001010000000',
        tenantType: 'TENANT',
        status: 'ACTIVE',
        monthlyIncome: expect.anything(),
      }),
      select: expect.any(Object),
    });
    expect(result.tenantResolution).toBe('CREATED');
  });

  it('rejects placement when a single-tenant property has an active lease', async () => {
    const transaction = makeTransaction();
    transaction.rentalApplication.findFirst.mockResolvedValue({
      ...baseApplication,
      property: {
        ...baseApplication.property,
        tenants: [{ id: 'active-lease' }],
      },
    });
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(transaction as never)
    );

    await expect(
      new PlacementCompletionRepository().complete(userId, applicationId, data)
    ).rejects.toBeInstanceOf(ValidationError);
    expect(transaction.propertyTenant.create).not.toHaveBeenCalled();
    expect(transaction.rentalApplication.update).not.toHaveBeenCalled();
  });

  it('rejects a duplicate active lease for the same property and unit', async () => {
    const transaction = makeTransaction();
    transaction.rentalApplication.findFirst.mockResolvedValue({
      ...baseApplication,
      property: {
        ...baseApplication.property,
        allowsMultipleTenants: true,
      },
    });
    transaction.propertyTenant.findFirst.mockResolvedValue({ id: 'duplicate-lease' });
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(transaction as never)
    );

    await expect(
      new PlacementCompletionRepository().complete(userId, applicationId, {
        ...data,
        unitLabel: 'Unit 2',
      })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(transaction.propertyTenant.create).not.toHaveBeenCalled();
  });

  it('creates the lease and marks the application placed atomically', async () => {
    const transaction = makeTransaction();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(transaction as never)
    );

    const result = await new PlacementCompletionRepository().complete(userId, applicationId, data);

    expect(transaction.propertyTenant.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        propertyId: 'property-1',
        tenantId: 'tenant-1',
        leaseStartDate: new Date('2026-08-01'),
        leaseEndDate: new Date('2027-07-31'),
        monthlyRent: expect.anything(),
        depositPaid: expect.anything(),
        moveInDate: new Date('2026-08-01'),
        unitLabel: null,
        isActive: true,
      }),
    });
    expect(transaction.rentalApplication.update).toHaveBeenCalledWith({
      where: { id: applicationId },
      data: { tenantId: 'tenant-1', status: 'PLACED' },
      select: { id: true, status: true, tenantId: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(result).toEqual(
      expect.objectContaining({
        application: {
          id: applicationId,
          status: 'PLACED',
          tenantId: 'tenant-1',
        },
        portalAccessActive: false,
        nextAction: 'ACTIVATE_PORTAL',
      })
    );
  });
});
