import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantService } from '../services/tenant.service';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    tenant: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    property: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    propertyTenant: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/features/tenants/repositories/tenant.repository', () => ({
  tenantRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getStatistics: vi.fn(),
  },
}));

vi.mock('@/lib/shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  emailTemplates: {
    tenantWelcomeWithPortal: vi.fn().mockReturnValue({
      subject: 'Welcome',
      html: '<p>Welcome</p>',
      text: 'Welcome',
    }),
    tenantWelcomeNoPortal: vi.fn().mockReturnValue({
      subject: 'Welcome',
      html: '<p>Welcome</p>',
      text: 'Welcome',
    }),
  },
}));

vi.mock('@/lib/password-generator', () => ({
  generateTenantPassword: vi.fn().mockReturnValue('TestPass123!'),
}));

vi.mock('@/lib/document-folders', () => ({
  createDefaultFoldersForTenant: vi.fn().mockResolvedValue([]),
}));

vi.mock('bcryptjs', () => {
  return {
    default: {
      hash: vi.fn().mockResolvedValue('hashedpassword123'),
    },
    hash: vi.fn().mockResolvedValue('hashedpassword123'),
  };
});

import { prisma } from '@/lib/db';
import { tenantRepository } from '@/lib/features/tenants/repositories/tenant.repository';
import { CreateTenantDTO } from '../dtos/tenant.dto';

describe('TenantService', () => {
  let service: TenantService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    service = new TenantService();
    vi.clearAllMocks();
  });

  describe('createTenant', () => {
    const validTenantData: CreateTenantDTO = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '0821234567',
      tenantType: 'TENANT',
      createPortalAccess: false,
      assignProperty: false,
    };

    it('should create a tenant without portal access', async () => {
      const mockTenant = {
        id: 'tenant-123',
        ...validTenantData,
        userId: mockUserId,
        status: 'ACTIVE',
      };

      vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.tenant.create).mockResolvedValue(mockTenant as never);

      const result = await service.createTenant(mockUserId, validTenantData);

      expect(result.tenant).toEqual(mockTenant);
      expect(result.generatedPassword).toBeNull();
      expect(prisma.tenant.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should create a tenant with portal access', async () => {
      const dataWithPortal: CreateTenantDTO = {
        ...validTenantData,
        createPortalAccess: true,
      };

      const mockTenant = {
        id: 'tenant-123',
        ...dataWithPortal,
        userId: mockUserId,
        status: 'ACTIVE',
      };

      vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.tenant.create).mockResolvedValue(mockTenant as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-456',
        email: validTenantData.email,
      } as never);

      const result = await service.createTenant(mockUserId, dataWithPortal);

      expect(result.tenant).toEqual(mockTenant);
      expect(result.generatedPassword).toBe('TestPass123!');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: validTenantData.email,
            accountType: 'TENANT',
            role: 'TENANT',
            requirePasswordChange: true,
          }),
        })
      );
    });

    it('should throw error if tenant email already exists', async () => {
      vi.mocked(prisma.tenant.findFirst).mockResolvedValue({
        id: 'existing-tenant',
        email: validTenantData.email,
      } as never);

      await expect(service.createTenant(mockUserId, validTenantData)).rejects.toThrow(
        'A tenant with this email already exists'
      );
    });

    it('should throw error if user account already exists when creating portal access', async () => {
      const dataWithPortal: CreateTenantDTO = {
        ...validTenantData,
        createPortalAccess: true,
      };

      vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: validTenantData.email,
      } as never);

      await expect(service.createTenant(mockUserId, dataWithPortal)).rejects.toThrow(
        'A user account with this email already exists'
      );
    });

    it('should create a tenant with property assignment', async () => {
      const dataWithProperty: CreateTenantDTO = {
        ...validTenantData,
        assignProperty: true,
        propertyId: 'property-123',
        leaseStartDate: '2026-02-01',
        propertyMonthlyRent: 5000,
        propertyDepositPaid: 10000,
      };

      const mockTenant = {
        id: 'tenant-123',
        ...dataWithProperty,
        userId: mockUserId,
        status: 'ACTIVE',
      };

      const mockProperty = {
        id: 'property-123',
        name: 'Test Property',
        userId: mockUserId,
        allowsMultipleTenants: false,
        tenants: [],
      };

      vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.tenant.create).mockResolvedValue(mockTenant as never);
      vi.mocked(prisma.property.findFirst).mockResolvedValue(mockProperty as never);
      vi.mocked(prisma.propertyTenant.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.propertyTenant.create).mockResolvedValue({} as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        firstName: 'Landlord',
        lastName: 'Name',
        email: 'landlord@example.com',
        phone: '0811234567',
      } as never);
      vi.mocked(prisma.property.findUnique).mockResolvedValue({
        name: 'Test Property',
        address: '123 Test St',
        city: 'Cape Town',
      } as never);

      const result = await service.createTenant(mockUserId, dataWithProperty);

      expect(result.tenant).toEqual(mockTenant);
      expect(prisma.propertyTenant.create).toHaveBeenCalledTimes(1);
      expect(prisma.propertyTenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            propertyId: 'property-123',
            tenantId: 'tenant-123',
            isActive: true,
          }),
        })
      );
    });

    it('should throw error if property already has active tenant', async () => {
      const dataWithProperty: CreateTenantDTO = {
        ...validTenantData,
        assignProperty: true,
        propertyId: 'property-123',
        leaseStartDate: '2026-02-01',
        propertyMonthlyRent: 5000,
      };

      const mockTenant = {
        id: 'tenant-123',
        ...dataWithProperty,
        userId: mockUserId,
        status: 'ACTIVE',
      };

      vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.tenant.create).mockResolvedValue(mockTenant as never);
      vi.mocked(prisma.property.findFirst).mockResolvedValue({
        id: 'property-123',
        userId: mockUserId,
        allowsMultipleTenants: false,
      } as never);
      vi.mocked(prisma.propertyTenant.findFirst).mockResolvedValue({
        id: 'existing-assignment',
        isActive: true,
      } as never);

      await expect(service.createTenant(mockUserId, dataWithProperty)).rejects.toThrow(
        'Property already has an active tenant assignment'
      );
    });
  });

  describe('update', () => {
    it('should update tenant details', async () => {
      const existingTenant = {
        id: 'tenant-123',
        userId: mockUserId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'ACTIVE',
      };

      vi.mocked(tenantRepository.findById).mockResolvedValue(existingTenant as never);
      vi.mocked(tenantRepository.update).mockResolvedValue({
        ...existingTenant,
        firstName: 'Jane',
      } as never);

      const result = await service.update('tenant-123', mockUserId, {
        firstName: 'Jane',
      });

      expect(result.firstName).toBe('Jane');
      expect(tenantRepository.update).toHaveBeenCalledWith(
        'tenant-123',
        expect.objectContaining({ firstName: 'Jane' })
      );
    });

    it('should throw error if tenant not found', async () => {
      vi.mocked(tenantRepository.findById).mockResolvedValue(null);

      await expect(
        service.update('nonexistent', mockUserId, { firstName: 'Jane' })
      ).rejects.toThrow();
    });

    it('should throw error if user does not own tenant', async () => {
      const existingTenant = {
        id: 'tenant-123',
        userId: 'other-user',
        firstName: 'John',
      };

      vi.mocked(tenantRepository.findById).mockResolvedValue(existingTenant as never);

      await expect(service.update('tenant-123', mockUserId, { firstName: 'Jane' })).rejects.toThrow(
        'You do not have permission to update this tenant'
      );
    });
  });

  describe('delete', () => {
    it('should delete tenant without active bookings', async () => {
      const existingTenant = {
        id: 'tenant-123',
        userId: mockUserId,
        bookings: [],
      };

      vi.mocked(tenantRepository.findById).mockResolvedValue(existingTenant as never);
      vi.mocked(tenantRepository.delete).mockResolvedValue({} as never);

      const result = await service.delete('tenant-123', mockUserId);

      expect(result.success).toBe(true);
      expect(tenantRepository.delete).toHaveBeenCalledWith('tenant-123');
    });

    it('should throw error if tenant has active bookings', async () => {
      const existingTenant = {
        id: 'tenant-123',
        userId: mockUserId,
        bookings: [{ status: 'CONFIRMED' }],
      };

      vi.mocked(tenantRepository.findById).mockResolvedValue(existingTenant as never);

      await expect(service.delete('tenant-123', mockUserId)).rejects.toThrow(
        'Cannot delete tenant with active bookings'
      );
    });
  });

  describe('list', () => {
    it('should list tenants with pagination', async () => {
      const mockTenants = [
        { id: 'tenant-1', firstName: 'John' },
        { id: 'tenant-2', firstName: 'Jane' },
      ];

      vi.mocked(prisma.tenant.findMany).mockResolvedValue(mockTenants as never);
      vi.mocked(prisma.tenant.count).mockResolvedValue(2);

      const result = await service.list(mockUserId, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockTenants);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter tenants by search term', async () => {
      vi.mocked(prisma.tenant.findMany).mockResolvedValue([]);
      vi.mocked(prisma.tenant.count).mockResolvedValue(0);

      await service.list(mockUserId, { search: 'john', page: 1, limit: 20 });

      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ firstName: { contains: 'john', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });
  });
});
