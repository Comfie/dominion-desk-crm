import { describe, expect, it } from 'vitest';

import { updateApplicantScreeningSchema } from '../dtos/screening.dto';

describe('updateApplicantScreeningSchema', () => {
  it('accepts checklist, affordability, consent, and notes fields', () => {
    const result = updateApplicantScreeningSchema.parse({
      creditCheckStatus: 'PASSED',
      affordabilityStatus: 'NEEDS_REVIEW',
      employerReferenceStatus: 'RECEIVED',
      landlordReferenceStatus: 'REQUESTED',
      ficaStatus: 'PENDING',
      declaredMonthlyIncome: 45000,
      riskScore: 32,
      consentReceived: true,
      notes: 'Awaiting the latest bank statement.',
    });

    expect(result).toMatchObject({
      creditCheckStatus: 'PASSED',
      affordabilityStatus: 'NEEDS_REVIEW',
      employerReferenceStatus: 'RECEIVED',
      landlordReferenceStatus: 'REQUESTED',
      ficaStatus: 'PENDING',
      declaredMonthlyIncome: 45000,
      riskScore: 32,
      consentReceived: true,
    });
  });

  it('rejects an empty update', () => {
    expect(() => updateApplicantScreeningSchema.parse({})).toThrow();
  });

  it('rejects affordability and risk values outside their valid ranges', () => {
    expect(() =>
      updateApplicantScreeningSchema.parse({
        declaredMonthlyIncome: -1,
        riskScore: 101,
      })
    ).toThrow();
  });
});
