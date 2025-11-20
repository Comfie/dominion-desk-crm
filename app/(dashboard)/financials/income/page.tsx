'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentCard } from '@/components/financials/payment-card';
import { formatCurrency } from '@/lib/utils';

async function fetchPayments(filters: Record<string, string>) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/payments?${params}`);
  if (!response.ok) throw new Error('Failed to fetch payments');
  return response.json();
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', statusFilter, typeFilter],
    queryFn: () =>
      fetchPayments({
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { paymentType: typeFilter }),
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Income & Payments" description="Track all payments and income">
        <Button asChild>
          <Link href="/financials/income/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Link>
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data?.summary ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Received</CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.totalAmount)}</div>
              <p className="text-muted-foreground text-xs">{data.summary.count} payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data.summary.paidAmount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(data.summary.pendingAmount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.totalAmount)}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-40 rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="REFUNDED">Refunded</option>
          <option value="FAILED">Failed</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-40 rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          <option value="">All Types</option>
          <option value="RENT">Rent</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="BOOKING">Booking</option>
          <option value="CLEANING_FEE">Cleaning Fee</option>
          <option value="UTILITIES">Utilities</option>
          <option value="LATE_FEE">Late Fee</option>
          <option value="DAMAGE">Damage</option>
          <option value="REFUND">Refund</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Payments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Failed to load payments</p>
          </CardContent>
        </Card>
      ) : data?.payments?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="text-muted-foreground/50 mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No payments yet</h3>
            <p className="text-muted-foreground mt-2">
              Record your first payment to start tracking income.
            </p>
            <Button asChild className="mt-4">
              <Link href="/financials/income/new">
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data?.payments?.map(
            (payment: {
              id: string;
              paymentReference: string;
              paymentType: string;
              amount: number;
              paymentMethod: string;
              paymentDate: string;
              status: string;
              booking?: {
                id: string;
                guestName: string;
                property?: {
                  id: string;
                  name: string;
                };
              } | null;
              tenant?: {
                id: string;
                firstName: string;
                lastName: string;
              } | null;
            }) => (
              <PaymentCard key={payment.id} payment={payment} />
            )
          )}
        </div>
      )}
    </div>
  );
}
