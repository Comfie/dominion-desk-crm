import { prisma } from '@/lib/db';
import { BillingInvoice, InvoiceStatus } from '@prisma/client';
import { calculateSubscriptionBilling } from './subscription.service';

/**
 * Billing Service
 * Handles invoice generation, billing history, and payment tracking
 * for landlord subscriptions
 */

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXXX (e.g., INV-20260202-00001)
 */
export async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Get the count of invoices created today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const count = await prisma.billingInvoice.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequence = (count + 1).toString().padStart(5, '0');
  return `INV-${dateStr}-${sequence}`;
}

/**
 * Generate an invoice for a user's subscription
 * Creates a new invoice record with current billing calculation
 */
export async function generateInvoice(
  userId: string,
  payfastPaymentId?: string
): Promise<BillingInvoice> {
  // Calculate current billing
  const billing = await calculateSubscriptionBilling(userId);

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Determine period (current month)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Create invoice
  const invoice = await prisma.billingInvoice.create({
    data: {
      userId,
      invoiceNumber,
      periodStart,
      periodEnd,
      baseFee: billing.baseFee,
      propertyFees: billing.totalPropertyFees,
      totalAmount: billing.totalMonthlyFee,
      breakdown: billing.breakdown as any, // Store as JSON
      status: payfastPaymentId ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
      paidAt: payfastPaymentId ? new Date() : null,
      payfastPaymentId,
    },
  });

  return invoice;
}

/**
 * Get billing history for a user with pagination
 */
export async function getBillingHistory(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  invoices: BillingInvoice[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.billingInvoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.billingInvoice.count({ where: { userId } }),
  ]);

  return {
    invoices,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Mark an invoice as paid
 */
export async function markInvoicePaid(
  invoiceId: string,
  payfastPaymentId: string
): Promise<BillingInvoice> {
  return prisma.billingInvoice.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
      payfastPaymentId,
    },
  });
}

/**
 * Find or create pending invoice for current period
 * Used when activating subscription to ensure we have an invoice record
 */
export async function findOrCreatePendingInvoice(userId: string): Promise<BillingInvoice> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Look for existing pending invoice for this period
  let invoice = await prisma.billingInvoice.findFirst({
    where: {
      userId,
      periodStart: {
        gte: periodStart,
        lt: new Date(now.getFullYear(), now.getMonth(), 2), // Within first day of month
      },
      status: InvoiceStatus.PENDING,
    },
  });

  // Create if doesn't exist
  if (!invoice) {
    invoice = await generateInvoice(userId);
  }

  return invoice;
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId: string): Promise<BillingInvoice | null> {
  return prisma.billingInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
        },
      },
    },
  });
}

/**
 * Get invoice by invoice number
 */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<BillingInvoice | null> {
  return prisma.billingInvoice.findUnique({
    where: { invoiceNumber },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
        },
      },
    },
  });
}

/**
 * Mark invoice as failed
 */
export async function markInvoiceFailed(invoiceId: string): Promise<BillingInvoice> {
  return prisma.billingInvoice.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.FAILED,
    },
  });
}

/**
 * Cancel invoice
 */
export async function cancelInvoice(invoiceId: string): Promise<BillingInvoice> {
  return prisma.billingInvoice.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.CANCELLED,
    },
  });
}

/**
 * Get total revenue for a period
 */
export async function getRevenueForPeriod(
  startDate: Date,
  endDate: Date
): Promise<{ totalRevenue: number; invoiceCount: number }> {
  const result = await prisma.billingInvoice.aggregate({
    where: {
      status: InvoiceStatus.PAID,
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  return {
    totalRevenue: Number(result._sum.totalAmount || 0),
    invoiceCount: result._count,
  };
}
