import { createHash } from 'crypto';
import type { PaymentStatus } from '@prisma/client';
import { BankTransactionStatus, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';
import { logger } from '@/lib/shared/logger';

import type { ImportStatementDTO } from '../dtos/reconciliation.dto';
import type { ReconciliationRepository } from '../repositories/reconciliation.repository';
import {
  OPEN_PAYMENT_STATUSES,
  reconciliationRepository,
} from '../repositories/reconciliation.repository';
import type { OpenPaymentCandidate, StatementCredit } from '../utils/matching';
import { HIGH_CONFIDENCE_THRESHOLD, suggestMatches } from '../utils/matching';
import { generatePaymentReference } from '../utils/payment-reference';
import type { ParsedStatementRow } from '../utils/statement-parser';
import { parseBankStatement, StatementParseError } from '../utils/statement-parser';

const toNumber = (value: Prisma.Decimal | number | null | undefined) =>
  value === null || value === undefined ? 0 : Number(value);

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Dedupe key for a statement line. Identical lines within one file (two
 * R500 transfers on the same day with the same description) are kept apart
 * by their occurrence index, and re-importing an overlapping statement
 * produces the same keys so nothing is imported twice.
 */
export function fingerprintRows(rows: ParsedStatementRow[]): string[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const base = [
      row.date.toISOString().slice(0, 10),
      row.amount.toFixed(2),
      row.description.toUpperCase().replace(/\s+/g, ' ').trim(),
      row.balance === null ? '' : row.balance.toFixed(2),
    ].join('|');
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    return createHash('sha256').update(`${base}|${occurrence}`).digest('hex');
  });
}

export class ReconciliationService {
  constructor(private readonly repo: ReconciliationRepository = reconciliationRepository) {}

  // -------------------------------------------------------------------------
  // Lease references
  // -------------------------------------------------------------------------

  /** Give every lease without an EFT reference a unique one. Idempotent. */
  async ensureLeaseReferences(userId: string): Promise<number> {
    const leases = await this.repo.findLeasesWithoutReference(userId);
    let assigned = 0;

    for (const lease of leases) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await this.repo.setLeaseReference(lease.id, generatePaymentReference());
          assigned++;
          break;
        } catch (error) {
          const isCollision =
            error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
          if (!isCollision || attempt === 4) throw error;
        }
      }
    }

    return assigned;
  }

  /** The reference a tenant should use when paying a given invoice. */
  async getReferenceForPayment(
    userId: string,
    propertyId: string | null,
    tenantId: string | null
  ): Promise<string | null> {
    if (!propertyId || !tenantId) return null;
    let lease = await this.repo.findLeaseReferenceForPayment(userId, propertyId, tenantId);
    if (lease && !lease.paymentReference) {
      await this.ensureLeaseReferences(userId);
      lease = await this.repo.findLeaseReferenceForPayment(userId, propertyId, tenantId);
    }
    return lease?.paymentReference ?? null;
  }

  // -------------------------------------------------------------------------
  // Candidates
  // -------------------------------------------------------------------------

  private async loadCandidates(userId: string): Promise<OpenPaymentCandidate[]> {
    await this.ensureLeaseReferences(userId);

    const [payments, leases] = await Promise.all([
      this.repo.findOpenPayments(userId),
      this.repo.findLeaseReferences(userId),
    ]);

    // Active leases come first, so the first reference per key wins.
    const referenceByLease = new Map<string, string>();
    for (const lease of leases) {
      const key = `${lease.propertyId}|${lease.tenantId}`;
      if (lease.paymentReference && !referenceByLease.has(key)) {
        referenceByLease.set(key, lease.paymentReference);
      }
    }

    return payments
      .filter((p) => p.tenant)
      .map((p) => ({
        id: p.id,
        tenantFirstName: p.tenant!.firstName,
        tenantLastName: p.tenant!.lastName,
        leaseReference: referenceByLease.get(`${p.propertyId}|${p.tenantId}`) ?? null,
        invoiceNumber: p.invoiceNumber,
        paymentReference: p.paymentReference,
        amountDue: toNumber(p.amount),
        amountAlreadyPaid: round2(
          p.bankTransactions.reduce((sum, t) => sum + toNumber(t.amount), 0)
        ),
        dueDate: p.dueDate,
      }));
  }

  // -------------------------------------------------------------------------
  // Import
  // -------------------------------------------------------------------------

  async importStatement(userId: string, actorId: string, dto: ImportStatementDTO) {
    let parsed;
    try {
      parsed = parseBankStatement(dto.content, dto.mapping);
    } catch (error) {
      if (error instanceof StatementParseError) {
        throw new ValidationError(error.message, {
          code: 'MAPPING_REQUIRED',
          headers: error.headers,
          sampleRows: error.sampleRows,
        });
      }
      throw error;
    }

    const fingerprints = fingerprintRows(parsed.rows);
    const credits = parsed.rows
      .map((row, i) => ({ row, fingerprint: fingerprints[i] }))
      .filter(({ row }) => row.amount > 0);

    const existing = await this.repo.findExistingFingerprints(
      userId,
      credits.map((c) => c.fingerprint)
    );
    const fresh = credits.filter((c) => !existing.has(c.fingerprint));

    const candidates = await this.loadCandidates(userId);
    const statementCredits: StatementCredit[] = fresh.map(({ row, fingerprint }) => ({
      key: fingerprint,
      date: row.date,
      description: row.description,
      amount: row.amount,
    }));
    const suggestions = new Map(
      suggestMatches(statementCredits, candidates).map((s) => [s.creditKey, s])
    );

    const dates = parsed.rows.map((r) => r.date.getTime());
    const created = await this.repo.createImportWithTransactions(
      {
        userId,
        fileName: dto.fileName,
        bankFormat: parsed.format,
        periodStart: dates.length ? new Date(Math.min(...dates)) : null,
        periodEnd: dates.length ? new Date(Math.max(...dates)) : null,
        totalRows: parsed.rows.length,
        creditRows: credits.length,
        newRows: fresh.length,
        autoMatched: suggestions.size,
        importedBy: actorId,
      },
      fresh.map(({ row, fingerprint }) => {
        const suggestion = suggestions.get(fingerprint);
        return {
          transactionDate: row.date,
          description: row.description.slice(0, 500),
          amount: new Prisma.Decimal(row.amount.toFixed(2)),
          balance: row.balance === null ? null : new Prisma.Decimal(row.balance.toFixed(2)),
          fingerprint,
          status: suggestion ? BankTransactionStatus.SUGGESTED : BankTransactionStatus.UNMATCHED,
          paymentId: suggestion?.paymentId ?? null,
          matchConfidence: suggestion?.confidence ?? null,
          matchReasons: suggestion ? suggestion.reasons : Prisma.JsonNull,
        };
      })
    );

    // Older unmatched lines may now match rent generated since their import.
    const rematched = await this.rematchUnmatched(userId);

    logger.info('Bank statement imported', {
      userId,
      importId: created.id,
      totalRows: parsed.rows.length,
      credits: credits.length,
      fresh: fresh.length,
      suggested: suggestions.size,
      rematched,
    });

    return {
      import: created,
      summary: {
        totalRows: parsed.rows.length,
        skippedRows: parsed.skippedRows,
        credits: credits.length,
        duplicates: credits.length - fresh.length,
        newTransactions: fresh.length,
        suggested: suggestions.size,
        highConfidence: [...suggestions.values()].filter(
          (s) => s.confidence >= HIGH_CONFIDENCE_THRESHOLD
        ).length,
        rematched,
      },
    };
  }

  /** Re-run matching for lines that previously found no candidate. */
  async rematchUnmatched(userId: string): Promise<number> {
    const unmatched = await this.repo.findUnmatchedTransactions(userId);
    if (unmatched.length === 0) return 0;

    const candidates = await this.loadCandidates(userId);
    const suggestions = suggestMatches(
      unmatched.map((t) => ({
        key: t.id,
        date: t.transactionDate,
        description: t.description,
        amount: toNumber(t.amount),
      })),
      candidates
    );

    for (const s of suggestions) {
      await this.repo.applySuggestion(s.creditKey, s.paymentId, s.confidence, s.reasons);
    }
    return suggestions.length;
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /** Recalculate a payment's status from its confirmed bank lines. */
  private async syncPaymentStatus(
    tx: Prisma.TransactionClient,
    paymentId: string,
    actorId: string,
    latest?: { date: Date; description: string }
  ) {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { amount: true, dueDate: true, status: true },
    });
    if (!payment) return null;

    const sum = await this.repo.sumMatchedAmount(paymentId, tx);
    const paid = round2(toNumber(sum._sum.amount));
    const due = toNumber(payment.amount);

    let status: PaymentStatus;
    if (paid >= due - 0.009) status = 'PAID';
    else if (paid > 0) status = 'PARTIALLY_PAID';
    else status = payment.dueDate && payment.dueDate < new Date() ? 'OVERDUE' : 'PENDING';

    const data: Prisma.PaymentUpdateInput = { status };
    if (status === 'PAID' || status === 'PARTIALLY_PAID') {
      if (latest) {
        data.paymentDate = latest.date;
        data.bankReference = latest.description.slice(0, 190);
      }
      data.paymentMethod = 'EFT';
      data.verifiedAt = new Date();
      data.verifiedBy = actorId;
      data.verificationNotes = `Reconciled from bank statement (R${paid.toFixed(2)} received)`;
    } else {
      data.paymentDate = null;
      data.verifiedAt = null;
      data.verifiedBy = null;
      data.verificationNotes = null;
    }

    await this.repo.updatePayment(paymentId, data, tx);
    return { paymentId, status, paid, due };
  }

  async confirm(userId: string, actorId: string, transactionId: string, paymentId?: string) {
    return prisma.$transaction(async (tx) => {
      const txn = await this.repo.findTransaction(userId, transactionId, tx);
      if (!txn) throw new NotFoundError('Bank transaction', transactionId);
      if (txn.status === 'MATCHED') throw new ValidationError('This line is already matched');
      if (txn.status === 'IGNORED') throw new ValidationError('Restore this line before matching');

      const targetPaymentId = paymentId ?? txn.paymentId;
      if (!targetPaymentId) throw new ValidationError('Choose which rent invoice this pays');

      const payment = await this.repo.findPaymentForUser(userId, targetPaymentId, tx);
      if (!payment) throw new NotFoundError('Payment', targetPaymentId);
      if (!OPEN_PAYMENT_STATUSES.includes(payment.status)) {
        throw new ValidationError('That invoice is already fully paid');
      }

      await this.repo.updateTransaction(
        transactionId,
        {
          status: 'MATCHED',
          paymentId: targetPaymentId,
          matchedAt: new Date(),
          matchedBy: actorId,
          ...(paymentId && paymentId !== txn.paymentId
            ? { matchConfidence: null, matchReasons: ['Matched manually'] }
            : {}),
        },
        tx
      );

      return this.syncPaymentStatus(tx, targetPaymentId, actorId, {
        date: txn.transactionDate,
        description: txn.description,
      });
    });
  }

  async unmatch(userId: string, actorId: string, transactionId: string) {
    return prisma.$transaction(async (tx) => {
      const txn = await this.repo.findTransaction(userId, transactionId, tx);
      if (!txn) throw new NotFoundError('Bank transaction', transactionId);
      if (txn.status !== 'MATCHED' || !txn.paymentId) {
        throw new ValidationError('Only confirmed matches can be undone');
      }

      await this.repo.updateTransaction(
        transactionId,
        {
          status: 'UNMATCHED',
          paymentId: null,
          matchConfidence: null,
          matchReasons: Prisma.JsonNull,
          matchedAt: null,
          matchedBy: null,
        },
        tx
      );

      return this.syncPaymentStatus(tx, txn.paymentId, actorId);
    });
  }

  async setStatus(userId: string, transactionId: string, action: 'reject' | 'ignore' | 'restore') {
    const txn = await this.repo.findTransaction(userId, transactionId);
    if (!txn) throw new NotFoundError('Bank transaction', transactionId);
    if (txn.status === 'MATCHED') {
      throw new ValidationError('Undo the match first');
    }
    if (action === 'restore' && txn.status !== 'IGNORED') {
      throw new ValidationError('Only ignored lines can be restored');
    }

    return this.repo.updateTransaction(transactionId, {
      status: action === 'ignore' ? 'IGNORED' : 'UNMATCHED',
      paymentId: null,
      matchConfidence: null,
      matchReasons: Prisma.JsonNull,
    });
  }

  /** One click: confirm every suggestion at or above the confidence bar. */
  async confirmAll(userId: string, actorId: string, minConfidence = HIGH_CONFIDENCE_THRESHOLD) {
    const suggested = await this.repo.findSuggested(userId, minConfidence);
    let confirmed = 0;
    const failed: string[] = [];

    for (const s of suggested) {
      try {
        await this.confirm(userId, actorId, s.id);
        confirmed++;
      } catch (error) {
        // e.g. two lines suggested for the same invoice: first one wins.
        failed.push(s.id);
        logger.warn('Bulk confirm skipped a line', {
          transactionId: s.id,
          reason: error instanceof Error ? error.message : 'unknown',
        });
      }
    }

    return { confirmed, skipped: failed.length };
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  async getOverview(userId: string, status?: BankTransactionStatus, importId?: string) {
    const [counts, transactions, imports, leaseReferences] = await Promise.all([
      this.repo.statusCounts(userId),
      this.repo.listTransactions(userId, status, importId),
      this.repo.recentImports(userId),
      this.getLeaseReferences(userId),
    ]);

    const byStatus = Object.fromEntries(
      (['UNMATCHED', 'SUGGESTED', 'MATCHED', 'IGNORED'] as const).map((s) => {
        const row = counts.find((c) => c.status === s);
        return [s, { count: row?._count._all ?? 0, amount: round2(toNumber(row?._sum.amount)) }];
      })
    ) as Record<BankTransactionStatus, { count: number; amount: number }>;

    return {
      counts: byStatus,
      transactions: transactions.map((t) => ({
        id: t.id,
        transactionDate: t.transactionDate,
        description: t.description,
        amount: toNumber(t.amount),
        status: t.status,
        matchConfidence: t.matchConfidence,
        matchReasons: Array.isArray(t.matchReasons) ? (t.matchReasons as string[]) : [],
        payment: t.payment
          ? {
              id: t.payment.id,
              amount: toNumber(t.payment.amount),
              status: t.payment.status,
              dueDate: t.payment.dueDate,
              invoiceNumber: t.payment.invoiceNumber,
              description: t.payment.description,
              tenantName: t.payment.tenant
                ? `${t.payment.tenant.firstName} ${t.payment.tenant.lastName}`
                : null,
              propertyName: t.payment.property?.name ?? null,
            }
          : null,
      })),
      imports,
      leaseReferences,
    };
  }

  /** Every active lease with its EFT reference, for sharing with tenants. */
  async getLeaseReferences(userId: string) {
    await this.ensureLeaseReferences(userId);
    const leases = await this.repo.findActiveLeaseReferences(userId);
    return leases.map((l) => ({
      leaseId: l.id,
      reference: l.paymentReference,
      tenantId: l.tenant.id,
      tenantName: `${l.tenant.firstName} ${l.tenant.lastName}`,
      tenantFirstName: l.tenant.firstName,
      tenantPhone: l.tenant.phone,
      propertyName: l.property.name,
      unitLabel: l.unitLabel,
      monthlyRent: toNumber(l.monthlyRent),
    }));
  }

  /** Open invoices for the manual "match to…" picker. */
  async getOpenPayments(userId: string) {
    const payments = await this.repo.findOpenPayments(userId);
    return payments.map((p) => {
      const paid = round2(p.bankTransactions.reduce((sum, t) => sum + toNumber(t.amount), 0));
      return {
        id: p.id,
        tenantName: p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : 'Unknown tenant',
        propertyName: p.property?.name ?? null,
        description: p.description,
        invoiceNumber: p.invoiceNumber,
        dueDate: p.dueDate,
        amount: toNumber(p.amount),
        outstanding: round2(toNumber(p.amount) - paid),
        status: p.status,
      };
    });
  }
}

export const reconciliationService = new ReconciliationService();
