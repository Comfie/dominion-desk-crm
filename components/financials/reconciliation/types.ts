export type BankLineStatus = 'UNMATCHED' | 'SUGGESTED' | 'MATCHED' | 'IGNORED';

export interface LinkedPayment {
  id: string;
  amount: number;
  status: string;
  dueDate: string | null;
  invoiceNumber: string | null;
  description: string | null;
  tenantName: string | null;
  propertyName: string | null;
}

export interface BankLine {
  id: string;
  transactionDate: string;
  description: string;
  amount: number;
  status: BankLineStatus;
  matchConfidence: number | null;
  matchReasons: string[];
  payment: LinkedPayment | null;
}

export interface LeaseReference {
  leaseId: string;
  reference: string | null;
  tenantId: string;
  tenantName: string;
  tenantFirstName: string;
  tenantPhone: string | null;
  propertyName: string;
  unitLabel: string | null;
  monthlyRent: number;
}

export interface ReconciliationOverview {
  counts: Record<BankLineStatus, { count: number; amount: number }>;
  transactions: BankLine[];
  imports: Array<{
    id: string;
    fileName: string;
    createdAt: string;
    periodStart: string | null;
    periodEnd: string | null;
    newRows: number;
    autoMatched: number;
  }>;
  leaseReferences: LeaseReference[];
}

export interface OpenPayment {
  id: string;
  tenantName: string;
  propertyName: string | null;
  description: string | null;
  invoiceNumber: string | null;
  dueDate: string | null;
  amount: number;
  outstanding: number;
  status: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

/** Fetch wrapper for the `{ success, data } | { success: false, error }` API shape. */
export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const message = body?.error?.message ?? body?.error ?? 'Something went wrong';
    throw new ApiError(
      typeof message === 'string' ? message : 'Request failed',
      body?.error?.details
    );
  }
  return body.data as T;
}

export const rand = (n: number) =>
  `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const shortDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
