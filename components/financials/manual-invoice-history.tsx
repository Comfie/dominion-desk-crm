'use client';

import Link from 'next/link';
import { PaymentStatus } from '@prisma/client';
import { Eye, FileText, Send } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ManualInvoiceHistoryItem {
  id: string;
  invoiceNumber: string | null;
  amount: number;
  status: PaymentStatus;
  dueDate: string | Date | null;
  paymentDate: string | Date | null;
  description: string | null;
  notes: string | null;
  reminderCount: number;
  reminderSentAt: string | Date | null;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  property: {
    id: string;
    name: string;
    address: string | null;
  } | null;
}

interface ManualInvoiceHistoryProps {
  invoices: ManualInvoiceHistoryItem[];
  currency?: string;
  onRecordPayment?: (payment: ManualInvoiceHistoryItem, tenant: any, property: any) => void;
  onSendReminder?: (payment: ManualInvoiceHistoryItem, tenant: any) => void;
}

export function ManualInvoiceHistory({
  invoices,
  currency = 'ZAR',
  onRecordPayment,
  onSendReminder,
}: ManualInvoiceHistoryProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
    }).format(amount);

  const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return <Badge className="bg-green-600">PAID</Badge>;
      case PaymentStatus.OVERDUE:
        return <Badge variant="destructive">OVERDUE</Badge>;
      case PaymentStatus.PENDING_VERIFICATION:
        return <Badge variant="secondary">PENDING VERIFICATION</Badge>;
      case PaymentStatus.PENDING:
        return <Badge variant="outline">PENDING</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Manual Invoice History</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No manual invoices found for the selected filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => {
              const canFollowUp =
                invoice.status === PaymentStatus.PENDING ||
                invoice.status === PaymentStatus.OVERDUE;
              const canRecordPayment =
                invoice.status !== PaymentStatus.PAID && invoice.status !== PaymentStatus.REFUNDED;

              return (
                <div
                  key={invoice.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {invoice.invoiceNumber || 'Manual invoice'}
                      </span>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-muted-foreground truncate text-sm">
                      {invoice.tenant
                        ? `${invoice.tenant.firstName} ${invoice.tenant.lastName}`
                        : 'No tenant'}{' '}
                      {invoice.property?.name ? `- ${invoice.property.name}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <div className="text-sm">
                      <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                      <div className="text-muted-foreground text-xs">
                        Due {formatDate(invoice.dueDate)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild className="whitespace-nowrap">
                        <Link href={`/financials/payments/${invoice.id}`}>
                          <FileText className="mr-1 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      {canRecordPayment && invoice.tenant && invoice.property && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onRecordPayment?.(invoice, invoice.tenant, invoice.property)
                          }
                          className="whitespace-nowrap"
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Record
                        </Button>
                      )}
                      {canFollowUp && invoice.tenant && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSendReminder?.(invoice, invoice.tenant)}
                          className="whitespace-nowrap"
                        >
                          <Send className="mr-1 h-4 w-4" />
                          Remind
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
