import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTenantSchema } from '../dtos/tenant.dto';

describe('createTenantSchema', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a date of birth when the tenant is exactly 15 years old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

    const result = createTenantSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '0821234567',
      tenantType: 'TENANT',
      dateOfBirth: '2011-04-23',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a future date of birth', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

    const result = createTenantSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '0821234567',
      tenantType: 'TENANT',
      dateOfBirth: '2026-04-24',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['dateOfBirth']);
  });

  it('rejects a date of birth for someone younger than 15 years old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

    const result = createTenantSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '0821234567',
      tenantType: 'TENANT',
      dateOfBirth: '2011-04-24',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['dateOfBirth']);
  });

  it('rejects a lease end date that is not after the lease start date during tenant creation', () => {
    const result = createTenantSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '0821234567',
      tenantType: 'TENANT',
      assignProperty: true,
      propertyId: 'property-123',
      leaseStartDate: '2026-05-01',
      leaseEndDate: '2026-05-01',
      propertyMonthlyRent: 5000,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['leaseEndDate']);
  });
});
