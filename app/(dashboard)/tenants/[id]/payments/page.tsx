'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { PaymentStatus } from '@prisma/client';
import { exportToCsv, formatDateForCsv, formatCurrencyForCsv } from '@/lib/utils/export-csv';

export default function TenantPaymentLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    fetchTenant();
  }, [tenantId]);

  useEffect(() => {
    if (tenant) {
      fetchPaymentLedger();
    }
  }, [selectedYear, tenant]);

  const fetchTenant = async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`);
      if (response.ok) {
        const result = await response.json();
        setTenant(result);
      }
    } catch (error) {
      console.error('Error fetching tenant:', error);
    }
  };

  const fetchPaymentLedger = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedYear !== 'all') {
        params.append('year', selectedYear);
      }

      const response = await fetch(`/api/tenants/${tenantId}/payment-ledger?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch payment ledger');
      }

      const result = await response.json();
      setData(result);
    } catch (error: any) {
      console.error('Error fetching payment ledger:', error);
      toast({
        title: error.message || 'Failed to load payment ledger',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, { variant: any; label: string }> = {
      [PaymentStatus.PAID]: { variant: 'default', label: 'Paid' },
      [PaymentStatus.PENDING]: { variant: 'secondary', label: 'Pending' },
      [PaymentStatus.OVERDUE]: { variant: 'destructive', label: 'Overdue' },
      [PaymentStatus.PENDING_VERIFICATION]: {
        variant: 'secondary',
        label: 'Pending Verification',
      },
      [PaymentStatus.PARTIALLY_PAID]: {
        variant: 'secondary',
        label: 'Partially Paid',
      },
      [PaymentStatus.REFUNDED]: { variant: 'outline', label: 'Refunded' },
      [PaymentStatus.FAILED]: { variant: 'destructive', label: 'Failed' },
    };

    const config = variants[status] || { variant: 'outline', label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return '-';
    const labels: Record<string, string> = {
      EFT: 'EFT',
      CASH: 'Cash',
      CREDIT_CARD: 'Credit Card',
      DEBIT_CARD: 'Debit Card',
      PAYSTACK: 'Paystack',
      PAYPAL: 'PayPal',
      OTHER: 'Other',
    };
    return labels[method] || method;
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!tenant || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tenants">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, payments } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/tenants/${tenantId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
            <p className="text-muted-foreground">
              {tenant.firstName} {tenant.lastName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              if (!payments?.length) return;
              exportToCsv({
                filename: `payment-history-${tenant.firstName}-${tenant.lastName}.csv`,
                headers: [
                  'Date',
                  'Description',
                  'Property',
                  'Amount',
                  'Status',
                  'Days Late',
                  'Payment Method',
                ],
                rows: payments.map((p: any) => [
                  formatDateForCsv(p.paymentDate || p.dueDate),
                  p.description,
                  p.property?.name || '',
                  formatCurrencyForCsv(p.amount),
                  p.status,
                  p.daysLate,
                  p.paymentMethod || '',
                ]),
              });
              toast({ title: 'CSV exported successfully' });
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Paid</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="rounded-full bg-green-50 p-3 dark:bg-green-950">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">On-Time Rate</p>
                <p className="mt-2 text-2xl font-bold">{summary.onTimeRate.toFixed(1)}%</p>
                <p
                  className={`mt-1 text-xs ${
                    summary.onTimeRate >= 90
                      ? 'text-green-600 dark:text-green-400'
                      : summary.onTimeRate >= 70
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {summary.onTimeRate >= 90
                    ? 'Excellent'
                    : summary.onTimeRate >= 70
                      ? 'Good'
                      : 'Needs Improvement'}
                </p>
              </div>
              <div
                className={`rounded-full p-3 ${
                  summary.onTimeRate >= 90
                    ? 'bg-green-50 dark:bg-green-950'
                    : summary.onTimeRate >= 70
                      ? 'bg-yellow-50 dark:bg-yellow-950'
                      : 'bg-red-50 dark:bg-red-950'
                }`}
              >
                {summary.onTimeRate >= 70 ? (
                  <TrendingUp
                    className={`h-6 w-6 ${
                      summary.onTimeRate >= 90
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}
                  />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Avg. Days to Pay</p>
                <p className="mt-2 text-2xl font-bold">
                  {summary.avgDaysToPay >= 0 ? '+' : ''}
                  {summary.avgDaysToPay.toFixed(1)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {summary.avgDaysToPay <= 0
                    ? 'Pays early'
                    : summary.avgDaysToPay <= 3
                      ? 'Pays on time'
                      : 'Pays late'}
                </p>
              </div>
              <div className="rounded-full bg-blue-50 p-3 dark:bg-blue-950">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Current Balance</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.currentBalance)}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {summary.overdueCount > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      {summary.overdueCount} overdue
                    </span>
                  )}
                  {summary.overdueCount === 0 && summary.currentBalance > 0 && <span>Pending</span>}
                  {summary.currentBalance === 0 && <span>All paid</span>}
                </p>
              </div>
              <div
                className={`rounded-full p-3 ${
                  summary.currentBalance === 0
                    ? 'bg-green-50 dark:bg-green-950'
                    : summary.overdueCount > 0
                      ? 'bg-red-50 dark:bg-red-950'
                      : 'bg-yellow-50 dark:bg-yellow-950'
                }`}
              >
                <DollarSign
                  className={`h-6 w-6 ${
                    summary.currentBalance === 0
                      ? 'text-green-600 dark:text-green-400'
                      : summary.overdueCount > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No payment records found</div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Days Late</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{formatDate(payment.date)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.description}</div>
                          {payment.invoiceNumber && (
                            <div className="text-muted-foreground text-xs">
                              {payment.invoiceNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{payment.property?.name || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-center">
                        {payment.daysLate > 0 ? (
                          <span
                            className={`font-medium ${
                              payment.daysLate > 7
                                ? 'text-red-600 dark:text-red-400'
                                : payment.daysLate > 3
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            +{payment.daysLate}
                          </span>
                        ) : payment.daysLate === 0 ? (
                          <span className="text-muted-foreground">0</span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">
                            {payment.daysLate}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                      <TableCell className="text-right">
                        {payment.invoiceUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/financials/payments/${payment.id}`}>
                              <FileText className="mr-1 h-4 w-4" />
                              View
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
