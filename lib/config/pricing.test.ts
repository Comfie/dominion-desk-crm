import { describe, expect, it } from 'vitest';

import { calculateUnitPricing, UNITS_TO_CAP } from './pricing';

describe('calculateUnitPricing', () => {
  it.each([
    [0, 299, true, false],
    [1, 299, true, false],
    [3, 299, true, false],
    [4, 396, false, false],
    [10, 990, false, false],
    [11, 999, false, true],
    [40, 999, false, true],
  ])('%i units → R%i', (units, total, minimumApplied, capApplied) => {
    const result = calculateUnitPricing(units);
    expect(result.total).toBe(total);
    expect(result.minimumApplied).toBe(minimumApplied);
    expect(result.capApplied).toBe(capApplied);
  });

  it('caps from 11 units', () => {
    expect(UNITS_TO_CAP).toBe(11);
  });
});
