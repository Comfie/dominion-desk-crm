import { descriptionContainsReference, normalizeForMatching } from './payment-reference';

/**
 * Reconciliation matching engine (pure, no I/O).
 *
 * Scores every (bank credit, open rent payment) pair and assigns matches
 * one-to-one, highest score first. Every score carries human-readable
 * reasons so the landlord can see WHY we suggested a match. Nothing is marked
 * paid until the landlord confirms.
 */

export const SUGGEST_THRESHOLD = 50;
export const HIGH_CONFIDENCE_THRESHOLD = 80;

export interface OpenPaymentCandidate {
  id: string;
  tenantFirstName: string;
  tenantLastName: string;
  leaseReference: string | null; // stable lease reference, e.g. DD-7K3M9Q
  invoiceNumber: string | null;
  paymentReference: string | null; // per-invoice reference
  amountDue: number;
  amountAlreadyPaid: number; // sum of confirmed bank lines already linked
  dueDate: Date | null;
}

export interface StatementCredit {
  key: string;
  date: Date;
  description: string;
  amount: number; // positive
}

export interface MatchScore {
  confidence: number;
  reasons: string[];
}

export interface MatchSuggestion extends MatchScore {
  creditKey: string;
  paymentId: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const money = (n: number) => `R${n.toFixed(2)}`;

function descriptionWords(description: string): Set<string> {
  return new Set(
    description
      .toUpperCase()
      .split(/[^A-Z]+/)
      .filter((w) => w.length >= 2)
  );
}

function nameTokens(name: string): string[] {
  return name
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter((w) => w.length >= 3);
}

export function outstandingFor(payment: OpenPaymentCandidate): number {
  return Math.round((payment.amountDue - payment.amountAlreadyPaid) * 100) / 100;
}

export function scoreMatch(credit: StatementCredit, payment: OpenPaymentCandidate): MatchScore {
  const reasons: string[] = [];
  let score = 0;

  // 1. Reference signals (strongest). Don't stack: take the best one.
  let referenceScore = 0;
  if (
    payment.leaseReference &&
    descriptionContainsReference(credit.description, payment.leaseReference)
  ) {
    referenceScore = 60;
    reasons.push(`Reference ${payment.leaseReference} found in bank description`);
  } else if (
    payment.invoiceNumber &&
    normalizeForMatching(payment.invoiceNumber).length >= 8 &&
    normalizeForMatching(credit.description).includes(normalizeForMatching(payment.invoiceNumber))
  ) {
    referenceScore = 55;
    reasons.push(`Invoice ${payment.invoiceNumber} found in bank description`);
  } else if (
    payment.paymentReference &&
    descriptionContainsReference(credit.description, payment.paymentReference)
  ) {
    referenceScore = 55;
    reasons.push(`Payment reference found in bank description`);
  }
  score += referenceScore;

  // 2. Amount
  const outstanding = outstandingFor(payment);
  const diff = Math.abs(credit.amount - outstanding);
  if (diff < 0.01) {
    score += 25;
    reasons.push(`Amount ${money(credit.amount)} equals outstanding rent`);
  } else if (Math.abs(credit.amount - payment.amountDue) < 0.01) {
    score += 20;
    reasons.push(`Amount ${money(credit.amount)} equals the invoiced rent`);
  } else if (credit.amount < outstanding && credit.amount >= outstanding * 0.2) {
    score += 8;
    reasons.push(`Partial payment: ${money(credit.amount)} of ${money(outstanding)}`);
  } else if (credit.amount > outstanding && credit.amount <= outstanding * 1.1) {
    score += 5;
    reasons.push(`Slight overpayment: ${money(credit.amount)} vs ${money(outstanding)}`);
  }

  // 3. Tenant name in description
  const words = descriptionWords(credit.description);
  const surnameHit = nameTokens(payment.tenantLastName).some((t) => words.has(t));
  const firstNameHit = nameTokens(payment.tenantFirstName).some((t) => words.has(t));
  if (surnameHit) {
    score += 20;
    reasons.push(`Tenant surname "${payment.tenantLastName}" appears in description`);
  }
  if (firstNameHit) {
    score += 5;
    reasons.push(`Tenant first name "${payment.tenantFirstName}" appears in description`);
  }

  // 4. Timing relative to the due date
  if (payment.dueDate) {
    const days = (credit.date.getTime() - payment.dueDate.getTime()) / DAY_MS;
    if (days >= -7 && days <= 15) {
      score += 5;
      reasons.push('Paid close to the due date');
    }
  }

  return { confidence: Math.min(100, Math.round(score)), reasons };
}

/**
 * Greedy one-to-one assignment. Each credit gets at most one payment and each
 * payment at most one credit per run; the highest-confidence pairs win.
 */
export function suggestMatches(
  credits: StatementCredit[],
  payments: OpenPaymentCandidate[],
  threshold = SUGGEST_THRESHOLD
): MatchSuggestion[] {
  const open = payments.filter((p) => outstandingFor(p) > 0.009);
  const pairs: MatchSuggestion[] = [];

  for (const credit of credits) {
    if (credit.amount <= 0) continue;
    for (const payment of open) {
      const score = scoreMatch(credit, payment);
      if (score.confidence >= threshold) {
        pairs.push({ creditKey: credit.key, paymentId: payment.id, ...score });
      }
    }
  }

  const dueDateOf = new Map(open.map((p) => [p.id, p.dueDate?.getTime() ?? 0]));
  const creditDateOf = new Map(credits.map((c) => [c.key, c.date.getTime()]));

  pairs.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    // Tie-break: the payment whose due date is closest to the credit date.
    const da = Math.abs((creditDateOf.get(a.creditKey) ?? 0) - (dueDateOf.get(a.paymentId) ?? 0));
    const db = Math.abs((creditDateOf.get(b.creditKey) ?? 0) - (dueDateOf.get(b.paymentId) ?? 0));
    return da - db;
  });

  const usedCredits = new Set<string>();
  const usedPayments = new Set<string>();
  const result: MatchSuggestion[] = [];

  for (const pair of pairs) {
    if (usedCredits.has(pair.creditKey) || usedPayments.has(pair.paymentId)) continue;
    usedCredits.add(pair.creditKey);
    usedPayments.add(pair.paymentId);
    result.push(pair);
  }

  return result;
}
