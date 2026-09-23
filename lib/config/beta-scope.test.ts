import { describe, expect, it } from 'vitest';

import { isApiHiddenInBeta, isPageHiddenInBeta } from './beta-scope';

describe('beta scope', () => {
  it('hides unfinished pages in beta mode', () => {
    expect(isPageHiddenInBeta('/bookings')).toBe(true);
    expect(isPageHiddenInBeta('/bookings/abc/edit')).toBe(true);
    expect(isPageHiddenInBeta('/placement/mandates')).toBe(true);
    expect(isPageHiddenInBeta('/settings/integrations')).toBe(true);
    expect(isPageHiddenInBeta('/portal/payments/abc/pay/mock')).toBe(true);
  });

  it('keeps core beta pages visible', () => {
    for (const path of [
      '/dashboard',
      '/properties',
      '/tenants/abc',
      '/financials/rent-collection',
      '/financials/reconciliation',
      '/maintenance',
      '/portal/payments/abc/pay',
      '/settings/profile',
    ]) {
      expect(isPageHiddenInBeta(path)).toBe(false);
    }
  });

  it('does not confuse similar prefixes', () => {
    expect(isPageHiddenInBeta('/bookingsx')).toBe(false);
  });

  it('blocks mock payment APIs', () => {
    expect(isApiHiddenInBeta('/api/payments/paystack')).toBe(true);
    expect(isApiHiddenInBeta('/api/tenant/payments/paystack/initialize')).toBe(true);
    expect(isApiHiddenInBeta('/api/payments')).toBe(false);
    expect(isApiHiddenInBeta('/api/reconciliation/import')).toBe(false);
  });

  it('shows everything when beta mode is off', () => {
    expect(isPageHiddenInBeta('/bookings', false)).toBe(false);
    expect(isApiHiddenInBeta('/api/payments/paystack', false)).toBe(false);
  });
});
