import { describe, expect, it } from 'vitest';

import type { OpenPaymentCandidate, StatementCredit } from '../utils/matching';
import {
  HIGH_CONFIDENCE_THRESHOLD,
  scoreMatch,
  suggestMatches,
  SUGGEST_THRESHOLD,
} from '../utils/matching';
import { descriptionContainsReference, generatePaymentReference } from '../utils/payment-reference';

const date = (s: string) => new Date(`${s}T12:00:00Z`);

const payment = (overrides: Partial<OpenPaymentCandidate> = {}): OpenPaymentCandidate => ({
  id: 'pay-moyo',
  tenantFirstName: 'Thandi',
  tenantLastName: 'Moyo',
  leaseReference: 'DD-7K3M9Q',
  invoiceNumber: 'INV-202609-cmabc123',
  paymentReference: 'PAY-1757000000000-ABC1234',
  amountDue: 8500,
  amountAlreadyPaid: 0,
  dueDate: date('2026-09-01'),
  ...overrides,
});

const credit = (overrides: Partial<StatementCredit> = {}): StatementCredit => ({
  key: 'row-1',
  date: date('2026-09-01'),
  description: 'FNB APP PAYMENT FROM DD7K3M9Q',
  amount: 8500,
  ...overrides,
});

describe('payment references', () => {
  it('generates DD-XXXXXX references without ambiguous characters', () => {
    for (let i = 0; i < 200; i++) {
      expect(generatePaymentReference()).toMatch(/^DD-[2-9A-HJKMNP-Z]{6}$/);
    }
  });

  it('matches references with hyphens stripped or lowercased', () => {
    expect(descriptionContainsReference('payment dd7k3m9q', 'DD-7K3M9Q')).toBe(true);
    expect(descriptionContainsReference('DD 7K3M 9Q rent', 'DD-7K3M9Q')).toBe(true);
    expect(descriptionContainsReference('DD-7K3M9X', 'DD-7K3M9Q')).toBe(false);
  });
});

describe('scoreMatch', () => {
  it('is high confidence when reference and amount match', () => {
    const score = scoreMatch(credit(), payment());
    expect(score.confidence).toBeGreaterThanOrEqual(HIGH_CONFIDENCE_THRESHOLD);
    expect(score.reasons.join(' ')).toContain('DD-7K3M9Q');
  });

  it('suggests (but is not high confidence) on amount + surname + timing', () => {
    const score = scoreMatch(
      credit({ description: 'ABSA TRANSFER T MOYO RENT' }),
      payment({ leaseReference: null })
    );
    expect(score.confidence).toBeGreaterThanOrEqual(SUGGEST_THRESHOLD);
    expect(score.confidence).toBeLessThan(HIGH_CONFIDENCE_THRESHOLD);
  });

  it('does not suggest on amount alone', () => {
    const score = scoreMatch(credit({ description: 'CASH DEPOSIT' }), payment());
    expect(score.confidence).toBeLessThan(SUGGEST_THRESHOLD);
  });

  it('recognises partial payments against the outstanding balance', () => {
    const score = scoreMatch(credit({ amount: 4000 }), payment());
    expect(score.reasons.join(' ')).toContain('Partial payment');
    expect(score.confidence).toBeGreaterThanOrEqual(SUGGEST_THRESHOLD);
  });

  it('uses the outstanding balance after earlier partial payments', () => {
    const score = scoreMatch(credit({ amount: 4500 }), payment({ amountAlreadyPaid: 4000 }));
    expect(score.reasons.join(' ')).toContain('equals outstanding rent');
  });
});

describe('suggestMatches', () => {
  it('assigns one-to-one, highest confidence first', () => {
    const payments = [
      payment(),
      payment({
        id: 'pay-dube',
        tenantFirstName: 'Sipho',
        tenantLastName: 'Dube',
        leaseReference: 'DD-ABC234',
        amountDue: 8500,
      }),
    ];
    const credits = [
      credit({ key: 'c1', description: 'DEPOSIT DD-ABC234' }),
      credit({ key: 'c2', description: 'DEPOSIT DD-7K3M9Q' }),
    ];

    const result = suggestMatches(credits, payments);

    expect(result).toHaveLength(2);
    expect(result.find((r) => r.creditKey === 'c1')?.paymentId).toBe('pay-dube');
    expect(result.find((r) => r.creditKey === 'c2')?.paymentId).toBe('pay-moyo');
  });

  it('never assigns the same payment twice', () => {
    const credits = [
      credit({ key: 'c1', description: 'DD-7K3M9Q' }),
      credit({ key: 'c2', description: 'DD-7K3M9Q' }),
    ];
    expect(suggestMatches(credits, [payment()])).toHaveLength(1);
  });

  it('skips fully paid payments and debits', () => {
    expect(suggestMatches([credit()], [payment({ amountAlreadyPaid: 8500 })])).toHaveLength(0);
    expect(suggestMatches([credit({ amount: -8500 })], [payment()])).toHaveLength(0);
  });
});
