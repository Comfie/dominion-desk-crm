'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Download,
  AlertCircle,
  Building2,
  LogOut,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  paymentDate: string | null;
  status: string;
  description: string | null;
  paymentReference: string;
  property: {
    id: string;
    name: string;
    address: string | null;
  } | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string;
    phone: string | null;
  };
}

interface TenantPaymentsData {
  payments: Payment[];
  tenant: {
    id: string;
    name: string;
    email: string;
  };
}

export default function TenantPaymentsPage() {
  const { data, isLoading } = useQuery<TenantPaymentsData>({
    queryKey: ['tenant-payments'],
    queryFn: async () => {
      const response = await fetch('/api/tenant/payments');
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const config = {
      PAID: { variant: 'default' as const, className: 'bg-green-600' },
      PENDING: { variant: 'secondary' as const, className: 'bg-yellow-600' },
      OVERDUE: { variant: 'destructive' as const, className: 'bg-red-600' },
      PARTIALLY_PAID: { variant: 'secondary' as const, className: 'bg-orange-600' },
      FAILED: { variant: 'destructive' as const, className: 'bg-red-700' },
    };

    const statusConfig = config[status as keyof typeof config] || config.PENDING;

    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const overduePayments = data?.payments?.filter((p: Payment) => p.status === 'OVERDUE') || [];

  const pendingPayments = data?.payments?.filter((p: Payment) => p.status === 'PENDING') || [];

  const totalOverdue = overduePayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-gradient-header border-b border-white/10 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4">
          <Link href="/portal/dashboard" className="flex items-center gap-2 text-white">
            <Building2 className="h-6 w-6 flex-shrink-0" />
            <span className="hidden text-lg font-semibold sm:inline">Tenant Portal</span>
            <span className="text-lg font-semibold sm:hidden">Portal</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden max-w-[150px] truncate text-sm text-white/80 md:inline">
              {data?.tenant.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <Link href="/portal/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">My Payments</h1>
          <p className="text-muted-foreground">View your rent payments and download invoices</p>
        </div>

        {/* Alert for overdue payments */}
        {overduePayments.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {overduePayments.length} overdue payment
              {overduePayments.length > 1 ? 's' : ''} totaling{' '}
              <strong>{formatCurrency(totalOverdue)}</strong>. Please make payment as soon as
              possible.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Overdue</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {formatCurrency(totalOverdue)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Payments</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">
                {formatCurrency(totalPending)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {pendingPayments.length} payment{pendingPayments.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Payments</CardDescription>
              <CardTitle className="text-2xl">{data?.payments?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>View all your payments and download invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <Skeleton className="mb-2 h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                ))
              ) : data?.payments?.length === 0 ? (
                <div className="py-12 text-center">
                  <DollarSign className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <p className="text-lg font-medium">No payments found</p>
                  <p className="text-muted-foreground text-sm">
                    Your payment history will appear here
                  </p>
                </div>
              ) : (
                data?.payments?.map((payment: Payment) => (
                  <div
                    key={payment.id}
                    className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Payment Info */}
                      <div className="flex-1">
                        <div className="mb-2 flex items-start gap-2">
                          <h3 className="font-semibold">{payment.description || 'Rent Payment'}</h3>
                          {getStatusBadge(payment.status)}
                        </div>

                        <div className="text-muted-foreground space-y-1 text-sm">
                          {payment.property && (
                            <p>
                              <strong>Property:</strong> {payment.property.name}
                              {payment.property.address && ` - ${payment.property.address}`}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4">
                            {payment.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Due: {formatDate(payment.dueDate)}</span>
                              </div>
                            )}
                            {payment.paymentDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Paid: {formatDate(payment.paymentDate)}</span>
                              </div>
                            )}
                          </div>

                          <p>
                            <strong>Reference:</strong> {payment.paymentReference}
                          </p>
                        </div>
                      </div>

                      {/* Amount and Actions */}
                      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {payment.currency} {Number(payment.amount).toFixed(2)}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(`/api/tenant/payments/${payment.id}/invoice`, '_blank')
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          View Invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        {data?.payments && data.payments.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>Need help with a payment?</strong> Contact your landlord at{' '}
                <a
                  href={`mailto:${data.payments[0]?.user.email}`}
                  className="text-primary hover:underline"
                >
                  {data.payments[0]?.user.email}
                </a>
                {data.payments[0]?.user.phone && (
                  <>
                    {' '}
                    or call{' '}
                    <a
                      href={`tel:${data.payments[0].user.phone}`}
                      className="text-primary hover:underline"
                    >
                      {data.payments[0].user.phone}
                    </a>
                  </>
                )}
              </p>
              <p className="text-muted-foreground">
                Click "View Invoice" on any payment to see full banking details and payment
                instructions.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
