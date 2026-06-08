import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/features/payments/services/payment.service', () => ({
  paymentService: {
    getRentCollectionData: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/shared/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { PaymentStatus, PaymentType } from '@prisma/client';
import { prisma } from '@/lib/db';
import { paymentService } from '@/lib/features/payments/services/payment.service';
import { GET } from './route';

describe('GET /api/rent-collection', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' },
    } as never);

    vi.mocked(paymentService.getRentCollectionData).mockResolvedValue({
      properties: [],
      summary: {
        overdueCount: 0,
        pendingVerificationCount: 0,
      },
      monthlyTrend: [],
    } as never);

    vi.mocked(prisma.task.findMany).mockResolvedValue([]);
  });

  it('returns manual invoices for the selected rent collection period', async () => {
    vi.mocked(prisma.payment.findMany).mockResolvedValue([
      {
        id: 'payment-123',
        invoiceNumber: 'INV-MANUAL-123',
        amount: { toString: () => '450.50' },
        status: PaymentStatus.PENDING,
        dueDate: new Date('2026-06-15'),
        paymentDate: null,
        paymentType: PaymentType.OTHER,
        description: 'Manual Invoice\nWater: R450.50',
        notes: 'June water charge',
        reminderCount: 1,
        reminderSentAt: new Date('2026-06-16'),
        tenant: {
          id: 'tenant-123',
          firstName: 'Jane',
          lastName: 'Tenant',
          email: 'jane@example.com',
        },
        property: {
          id: 'property-123',
          name: 'Oak House',
          address: '1 Oak Road',
        },
      },
    ] as never);

    const response = await GET(
      new NextRequest(
        'http://localhost/api/rent-collection?month=6&year=2026&propertyId=all&status=all'
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        manualInvoices: [
          expect.objectContaining({
            id: 'payment-123',
            invoiceNumber: 'INV-MANUAL-123',
            amount: 450.5,
            status: PaymentStatus.PENDING,
            tenant: expect.objectContaining({
              firstName: 'Jane',
              lastName: 'Tenant',
            }),
            property: expect.objectContaining({
              name: 'Oak House',
            }),
          }),
        ],
      })
    );
  });
});
