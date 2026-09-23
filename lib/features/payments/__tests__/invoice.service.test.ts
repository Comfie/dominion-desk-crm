import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ prisma: {} }));

import type { PaymentWithDetails } from '../repositories/payment.repository';
import { invoiceService, resolveEftReference } from '../services/invoice.service';

const payment = {
  id: 'pay-1',
  userId: 'landlord-1',
  propertyId: 'prop-1',
  tenantId: 'tenant-1',
  paymentReference: 'PAY-1757000000000-ABC1234',
  invoiceNumber: 'INV-202610-tenant01',
  amount: 8500,
  currency: 'ZAR',
  status: 'PENDING',
  description: 'Rent for October 2026',
  dueDate: new Date('2026-10-01T00:00:00Z'),
  createdAt: new Date('2026-09-25T00:00:00Z'),
  property: { id: 'prop-1', name: 'Loveday Court', address: '14 Loveday St' },
  user: { firstName: 'Comfie', lastName: 'Landlord', email: 'landlord@example.com' },
  tenant: {
    firstName: 'Thandi',
    lastName: 'Moyo',
    email: 't@example.com',
    properties: [
      {
        propertyId: 'prop-1',
        isActive: true,
        unitLabel: 'Unit 2',
        paymentReference: 'DD-7K3M9Q',
        property: { id: 'prop-1', name: 'Loveday Court' },
      },
    ],
  },
} as unknown as PaymentWithDetails;

const banking = {
  bankName: 'FNB',
  bankAccountName: 'C Landlord',
  bankAccountNumber: '62000000000',
  bankBranchCode: '250655',
};

describe('invoice generation', () => {
  it('uses the lease reference, not the per-invoice reference', () => {
    expect(resolveEftReference(payment)).toBe('DD-7K3M9Q');
    expect(resolveEftReference(payment, { eftReference: 'DD-OVERRIDE' })).toBe('DD-OVERRIDE');
  });

  it('falls back to the invoice reference when the lease has none', () => {
    const noLease = { ...payment, tenant: { ...payment.tenant, properties: [] } } as never;
    expect(resolveEftReference(noLease)).toBe('PAY-1757000000000-ABC1234');
  });

  it('shows banking details and the reference in the HTML invoice', () => {
    const html = invoiceService.generateInvoiceHTML(payment, { banking });
    expect(html).toContain('62000000000');
    expect(html).toContain('DD-7K3M9Q');
    expect(html).toContain('Pay by EFT using this reference');
  });

  it('produces a clean plain-text invoice (no NUL or replacement characters)', () => {
    const text = invoiceService.generateInvoiceText(payment, { banking });
    expect(text).not.toMatch(/[\u0000\uFFFD]/);
    expect(text).toContain('Payment Reference: DD-7K3M9Q');
    expect(text).toContain('Account Number: 62000000000');
  });
});
