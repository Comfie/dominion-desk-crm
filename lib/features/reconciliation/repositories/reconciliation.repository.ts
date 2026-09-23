import type { BankTransactionStatus, PaymentStatus, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

/** Payment statuses that can still receive money. */
export const OPEN_PAYMENT_STATUSES: PaymentStatus[] = [
  'PENDING',
  'OVERDUE',
  'PARTIALLY_PAID',
  'PENDING_VERIFICATION',
];

type Tx = Prisma.TransactionClient;

const transactionInclude = {
  payment: {
    select: {
      id: true,
      amount: true,
      status: true,
      dueDate: true,
      invoiceNumber: true,
      description: true,
      tenant: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.BankTransactionInclude;

export type BankTransactionWithPayment = Prisma.BankTransactionGetPayload<{
  include: typeof transactionInclude;
}>;

export class ReconciliationRepository {
  // -------------------------------------------------------------------------
  // Lease references
  // -------------------------------------------------------------------------

  findLeasesWithoutReference(userId: string) {
    return prisma.propertyTenant.findMany({
      where: { userId, paymentReference: null },
      select: { id: true },
    });
  }

  setLeaseReference(leaseId: string, paymentReference: string) {
    return prisma.propertyTenant.update({
      where: { id: leaseId },
      data: { paymentReference },
    });
  }

  findLeaseReferences(userId: string) {
    return prisma.propertyTenant.findMany({
      where: { userId },
      select: {
        propertyId: true,
        tenantId: true,
        unitLabel: true,
        paymentReference: true,
        isActive: true,
      },
      orderBy: { isActive: 'desc' },
    });
  }

  findLeaseReferenceForPayment(userId: string, propertyId: string, tenantId: string) {
    return prisma.propertyTenant.findFirst({
      where: { userId, propertyId, tenantId },
      select: { id: true, paymentReference: true },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findActiveLeaseReferences(userId: string) {
    return prisma.propertyTenant.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        unitLabel: true,
        paymentReference: true,
        monthlyRent: true,
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
        property: { select: { id: true, name: true } },
      },
      orderBy: [{ property: { name: 'asc' } }, { unitLabel: 'asc' }],
    });
  }

  // -------------------------------------------------------------------------
  // Payments
  // -------------------------------------------------------------------------

  findOpenPayments(userId: string) {
    return prisma.payment.findMany({
      where: {
        userId,
        status: { in: OPEN_PAYMENT_STATUSES },
        tenantId: { not: null },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        dueDate: true,
        invoiceNumber: true,
        paymentReference: true,
        description: true,
        propertyId: true,
        tenantId: true,
        tenant: { select: { firstName: true, lastName: true } },
        property: { select: { name: true } },
        bankTransactions: {
          where: { status: 'MATCHED' },
          select: { amount: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  findPaymentForUser(userId: string, paymentId: string, tx: Tx = prisma) {
    return tx.payment.findFirst({
      where: { id: paymentId, userId },
      select: { id: true, amount: true, status: true, dueDate: true },
    });
  }

  sumMatchedAmount(paymentId: string, tx: Tx = prisma) {
    return tx.bankTransaction.aggregate({
      where: { paymentId, status: 'MATCHED' },
      _sum: { amount: true },
    });
  }

  updatePayment(paymentId: string, data: Prisma.PaymentUpdateInput, tx: Tx = prisma) {
    return tx.payment.update({ where: { id: paymentId }, data });
  }

  // -------------------------------------------------------------------------
  // Imports & bank transactions
  // -------------------------------------------------------------------------

  async findExistingFingerprints(userId: string, fingerprints: string[]) {
    if (fingerprints.length === 0) return new Set<string>();
    const rows = await prisma.bankTransaction.findMany({
      where: { userId, fingerprint: { in: fingerprints } },
      select: { fingerprint: true },
    });
    return new Set(rows.map((r) => r.fingerprint));
  }

  createImportWithTransactions(
    importData: Omit<Prisma.BankStatementImportUncheckedCreateInput, 'transactions'>,
    transactions: Omit<Prisma.BankTransactionUncheckedCreateInput, 'importId' | 'userId'>[]
  ) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.bankStatementImport.create({ data: importData });
      if (transactions.length > 0) {
        await tx.bankTransaction.createMany({
          data: transactions.map((t) => ({
            ...t,
            importId: created.id,
            userId: importData.userId,
          })),
          skipDuplicates: true,
        });
      }
      return created;
    });
  }

  findUnmatchedTransactions(userId: string) {
    return prisma.bankTransaction.findMany({
      where: { userId, status: 'UNMATCHED' },
      select: { id: true, transactionDate: true, description: true, amount: true },
    });
  }

  applySuggestion(id: string, paymentId: string, confidence: number, reasons: string[]) {
    return prisma.bankTransaction.update({
      where: { id },
      data: {
        status: 'SUGGESTED',
        paymentId,
        matchConfidence: confidence,
        matchReasons: reasons,
      },
    });
  }

  listTransactions(userId: string, status?: BankTransactionStatus, importId?: string) {
    return prisma.bankTransaction.findMany({
      where: { userId, ...(status ? { status } : {}), ...(importId ? { importId } : {}) },
      include: transactionInclude,
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
      take: 500,
    });
  }

  findTransaction(userId: string, id: string, tx: Tx = prisma) {
    return tx.bankTransaction.findFirst({ where: { id, userId } });
  }

  findSuggested(userId: string, minConfidence: number) {
    return prisma.bankTransaction.findMany({
      where: { userId, status: 'SUGGESTED', matchConfidence: { gte: minConfidence } },
      select: { id: true, paymentId: true },
      orderBy: { matchConfidence: 'desc' },
    });
  }

  updateTransaction(id: string, data: Prisma.BankTransactionUncheckedUpdateInput, tx: Tx = prisma) {
    return tx.bankTransaction.update({ where: { id }, data });
  }

  async statusCounts(userId: string) {
    const grouped = await prisma.bankTransaction.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
      _sum: { amount: true },
    });
    return grouped;
  }

  recentImports(userId: string) {
    return prisma.bankStatementImport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }
}

export const reconciliationRepository = new ReconciliationRepository();
