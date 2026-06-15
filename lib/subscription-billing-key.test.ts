import { describe, expect, it } from 'vitest';

import { getBillingBreakdownKey } from './subscription-billing-key';

describe('getBillingBreakdownKey', () => {
  it('uses the lease id when available', () => {
    expect(
      getBillingBreakdownKey(
        {
          leaseId: 'lease-1',
          propertyId: 'property-1',
          tenantName: 'Jane Doe',
        },
        0
      )
    ).toBe('lease-1');
  });

  it('falls back to a unique key for legacy breakdown rows without a lease id', () => {
    const items = [
      { propertyId: 'property-1', tenantName: 'Jane Doe' },
      { propertyId: 'property-1', tenantName: 'John Smith' },
    ];

    const keys = items.map((item, index) => getBillingBreakdownKey(item, index));

    expect(keys).toEqual(['property-1:Jane Doe:0', 'property-1:John Smith:1']);
    expect(new Set(keys).size).toBe(items.length);
  });
});
