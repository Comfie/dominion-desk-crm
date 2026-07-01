import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
  },
}));

vi.mock('@/lib/password-generator', () => ({
  generateTenantPassword: vi.fn().mockReturnValue('TempPassword123!'),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  emailTemplates: {
    tenantWelcomeWithPortal: vi.fn().mockReturnValue({
      subject: 'Welcome',
      html: '<p>Welcome</p>',
      text: 'Welcome',
    }),
  },
}));

vi.mock('@/lib/db', () => {
  const prisma = {
    tenant: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    propertyTenant: {
      findFirst: vi.fn(),
    },
  };

  return { prisma, default: prisma };
});

import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';
import { GET, POST } from './route';

describe('/api/tenants/[id]/portal-access workspace ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: 'member-1',
        organizationId: 'agency-1',
        accountType: 'AGENCY',
      },
    } as never);
  });

  it('checks portal access using the organization workspace', async () => {
    vi.mocked(prisma.tenant.findFirst).mockResolvedValue({
      id: 'tenant-1',
      userId: 'agency-1',
      email: 'tenant@example.com',
      portalUserId: 'portal-1',
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'portal-1',
      accountType: 'TENANT',
      createdAt: new Date('2026-06-24T12:00:00Z'),
    } as never);

    const response = await GET(new Request('http://localhost/api/tenants/tenant-1/portal-access'), {
      params: Promise.resolve({ id: 'tenant-1' }),
    });

    expect(response.status).toBe(200);
    expect(prisma.tenant.findFirst).toHaveBeenCalledWith({
      where: { id: 'tenant-1', userId: 'agency-1' },
    });
  });

  it('creates portal access for a tenant owned by the organization workspace', async () => {
    vi.mocked(prisma.tenant.findFirst).mockResolvedValue({
      id: 'tenant-1',
      userId: 'agency-1',
      firstName: 'Lerato',
      lastName: 'Mokoena',
      email: 'tenant@example.com',
      phone: '0821234567',
      portalUserId: null,
    } as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'portal-1' } as never)
      .mockResolvedValueOnce({
        firstName: 'Agency',
        lastName: 'Owner',
        email: 'agency@example.com',
        phone: '0111234567',
      } as never);
    vi.mocked(prisma.propertyTenant.findFirst).mockResolvedValue(null);

    const response = await POST(
      new Request('http://localhost/api/tenants/tenant-1/portal-access', {
        method: 'POST',
        body: JSON.stringify({ action: 'create' }),
      }),
      { params: Promise.resolve({ id: 'tenant-1' }) }
    );

    expect(response.status).toBe(200);
    expect(prisma.tenant.findFirst).toHaveBeenCalledWith({
      where: { id: 'tenant-1', userId: 'agency-1' },
    });
    expect(prisma.user.findUnique).toHaveBeenLastCalledWith({
      where: { id: 'agency-1' },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });
  });

  it('relinks an existing tenant user account when the tenant link is missing', async () => {
    vi.mocked(prisma.tenant.findFirst).mockResolvedValue({
      id: 'tenant-1',
      userId: 'agency-1',
      firstName: 'Lerato',
      lastName: 'Mokoena',
      email: 'tenant@example.com',
      phone: '0821234567',
      portalUserId: null,
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'portal-existing',
      accountType: 'TENANT',
    } as never);

    const response = await POST(
      new Request('http://localhost/api/tenants/tenant-1/portal-access', {
        method: 'POST',
        body: JSON.stringify({ action: 'create' }),
      }),
      { params: Promise.resolve({ id: 'tenant-1' }) }
    );

    expect(response.status).toBe(200);
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { portalUserId: 'portal-existing' },
    });
  });
});
