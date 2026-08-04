import { describe, expect, it } from 'vitest';

import { completePlacementSchema } from '../dtos/placement-completion.dto';

describe('completePlacementSchema', () => {
  const validInput = {
    leaseStartDate: '2026-08-01',
    leaseEndDate: '2027-07-31',
    monthlyRent: 14500,
    depositPaid: 14500,
    moveInDate: '2026-08-01',
    unitLabel: 'Unit 2',
  };

  it('accepts a valid placement completion payload', () => {
    expect(completePlacementSchema.parse(validInput)).toEqual(validInput);
  });

  it('requires a lease start date and positive monthly rent', () => {
    const result = completePlacementSchema.safeParse({
      ...validInput,
      leaseStartDate: '',
      monthlyRent: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['leaseStartDate', 'monthlyRent'])
      );
    }
  });

  it('rejects a negative deposit', () => {
    const result = completePlacementSchema.safeParse({
      ...validInput,
      depositPaid: -1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['depositPaid']);
    }
  });

  it('rejects a lease end date before the lease start date', () => {
    const result = completePlacementSchema.safeParse({
      ...validInput,
      leaseEndDate: '2026-07-31',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['leaseEndDate']);
    }
  });

  it('normalizes optional empty values to null', () => {
    expect(
      completePlacementSchema.parse({
        leaseStartDate: '2026-08-01',
        leaseEndDate: '',
        monthlyRent: 14500,
        depositPaid: 0,
        moveInDate: '',
        unitLabel: '   ',
      })
    ).toEqual({
      leaseStartDate: '2026-08-01',
      leaseEndDate: null,
      monthlyRent: 14500,
      depositPaid: 0,
      moveInDate: null,
      unitLabel: null,
    });
  });
});
