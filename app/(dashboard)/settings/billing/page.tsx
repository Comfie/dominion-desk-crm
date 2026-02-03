'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  baseFee: number;
  propertyFees: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paidAt: string | null;
  createdAt: string;
}

interface BillingHistoryResponse {
  invoices: BillingInvoice[];
  total: number;
  page: number;
  totalPages: number;
}

export default function BillingHistoryPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery<BillingHistoryResponse>({
    queryKey: ['billing-history', page],
    queryFn: async () => {
      const response = await fetch(`/api/billing/history?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch billing history');
      return response.json();
    },
  });

  const getStatusColor = (status: BillingInvoice['status']) => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'FAILED':
      case 'CANCELLED':
        return 'destructive';
      case 'REFUNDED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Billing History" description="View all your past invoices and payments" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Invoices
          </CardTitle>
          <CardDescription>
            {data?.total ? `${data.total} total invoices` : 'No invoices yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data && data.invoices.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Billing Period</TableHead>
                    <TableHead>Base Fee</TableHead>
                    <TableHead>Property Fees</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(invoice.periodStart)}</div>
                          <div className="text-muted-foreground text-xs">
                            to {formatDate(invoice.periodEnd)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.baseFee)}</TableCell>
                      <TableCell>{formatCurrency(invoice.propertyFees)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {invoice.paidAt ? (
                            <>
                              <div>Paid</div>
                              <div className="text-muted-foreground text-xs">
                                {formatDate(invoice.paidAt)}
                              </div>
                            </>
                          ) : (
                            <div className="text-muted-foreground">
                              {formatDate(invoice.createdAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm">
                    Page {data.page} of {data.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground py-12 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 opacity-30" />
              <p className="text-lg font-medium">No invoices yet</p>
              <p className="text-sm">Your billing history will appear here once you subscribe</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
