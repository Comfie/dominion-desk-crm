'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Wrench,
  DollarSign,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PortalShell } from '@/components/portal/portal-shell';
import { MaintenanceRequestDialog } from '@/components/portal/maintenance-request-dialog';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentData {
  id: string;
  amount: number;
  paymentDate?: string;
  dueDate?: string | null;
  status: string;
  paymentReference: string;
  paymentType: string;
}

interface TenantPortalData {
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    property: {
      id: string;
      name: string;
      address: string;
      city: string;
    } | null;
    leaseStart: string | null;
    leaseEnd: string | null;
    rentAmount: number | null;
    nextPaymentDue: string | null;
  };
  maintenanceRequests: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  recentPayments: Array<PaymentData>;
  duePayments: Array<PaymentData>;
  overduePayments: Array<PaymentData>;
}

export default function TenantDashboardPage() {
  const queryClient = useQueryClient();
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery<TenantPortalData>({
    queryKey: ['tenant-portal'],
    queryFn: async () => {
      const response = await fetch('/api/portal/dashboard');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch data');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <PortalShell>
        <div className="portal-page">
          <Skeleton className="h-10 w-56 rounded-full bg-white/10" />
          <Skeleton className="h-64 rounded-[2rem] bg-white/10" />
          <div className="grid gap-5 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-[1.5rem] bg-white/10" />
            <Skeleton className="h-80 rounded-[1.5rem] bg-white/10" />
            <Skeleton className="h-80 rounded-[1.5rem] bg-white/10" />
          </div>
        </div>
      </PortalShell>
    );
  }

  if (error || !data) {
    return (
      <PortalShell>
        <Card className="portal-panel max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">Unable to Load Dashboard</h2>
            <p className="mb-4 text-sm text-white/65">
              {error instanceof Error ? error.message : 'No tenant record found for this account'}
            </p>
            <Link href="/portal/dashboard">
              <Button>Retry</Button>
            </Link>
          </CardContent>
        </Card>
      </PortalShell>
    );
  }

  const { tenant, maintenanceRequests, recentPayments, duePayments, overduePayments } = data;

  return (
    <PortalShell>
      <div className="portal-page">
        <section className="portal-hero">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
            <div className="space-y-4">
              <span className="portal-kicker">Tenant dashboard</span>
              <div className="space-y-3">
                <h1 className="portal-page-title">Welcome, {tenant.firstName}.</h1>
                <p className="portal-page-description">
                  Stay on top of rent, maintenance, and shared documents from one place built around
                  your active tenancy.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="portal-stat-card px-4 py-4">
                  <p className="portal-eyebrow">Open requests</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {maintenanceRequests.filter((request) => request.status !== 'COMPLETED').length}
                  </p>
                </div>
                <div className="portal-stat-card px-4 py-4">
                  <p className="portal-eyebrow">Recent payments</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{recentPayments.length}</p>
                </div>
                <div className="portal-stat-card px-4 py-4">
                  <p className="portal-eyebrow">Due soon</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {overduePayments.length + duePayments.length}
                  </p>
                </div>
              </div>
            </div>

            {tenant.property ? (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-2 text-sm font-medium text-white/75">
                  <Building2 className="h-4 w-4" />
                  Your Rental Property
                </div>
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-2xl font-semibold text-white">{tenant.property.name}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {tenant.property.address}, {tenant.property.city}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                      <p className="portal-eyebrow">Lease term</p>
                      <p className="mt-2 text-sm text-white/80">
                        {tenant.leaseStart && tenant.leaseEnd
                          ? `${formatDate(tenant.leaseStart)} - ${formatDate(tenant.leaseEnd)}`
                          : 'Not available'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                      <p className="portal-eyebrow">Monthly rent</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {tenant.rentAmount
                          ? `${formatCurrency(Number(tenant.rentAmount))}/month`
                          : 'Not available'}
                      </p>
                    </div>
                  </div>

                  {tenant.nextPaymentDue ? (
                    <div className="portal-status-warning rounded-2xl border px-4 py-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-4 w-4 text-amber-300" />
                        <div>
                          <p className="text-sm font-medium text-amber-50">Next payment due</p>
                          <p className="mt-1 text-sm text-amber-100/85">
                            {formatDate(tenant.nextPaymentDue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {overduePayments && overduePayments.length > 0 && (
          <Card className="portal-panel portal-status-danger">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-300" />
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    Overdue Payment{overduePayments.length > 1 ? 's' : ''}
                  </h3>
                  <p className="mb-4 max-w-2xl text-sm text-red-100/80">
                    You have {overduePayments.length} overdue payment
                    {overduePayments.length > 1 ? 's' : ''}. Please make payment immediately to
                    avoid additional charges.
                  </p>
                  <div className="space-y-3">
                    {overduePayments.map((payment) => {
                      const daysOverdue = payment.dueDate
                        ? Math.floor(
                            (new Date().getTime() - new Date(payment.dueDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : 0;
                      return (
                        <div
                          key={payment.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300/20 bg-black/10 p-4"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {formatCurrency(Number(payment.amount))}
                            </p>
                            <p className="text-xs text-red-100/75">
                              Due: {payment.dueDate ? formatDate(payment.dueDate) : 'N/A'} (
                              {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue)
                            </p>
                            <p className="text-xs text-red-200/65">
                              Ref: {payment.paymentReference}
                            </p>
                          </div>
                          <Link href={`/portal/payments/${payment.id}/pay`}>
                            <Button
                              size="sm"
                              className="bg-red-300 text-slate-950 hover:bg-red-200"
                            >
                              <DollarSign className="mr-1 h-4 w-4" />
                              Pay Now
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {duePayments && duePayments.length > 0 && overduePayments.length === 0 && (
          <Card className="portal-panel portal-status-warning">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 flex-shrink-0 text-amber-300" />
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    Payment{duePayments.length > 1 ? 's' : ''} Due Soon
                  </h3>
                  <p className="mb-4 max-w-2xl text-sm text-amber-100/80">
                    You have {duePayments.length} payment{duePayments.length > 1 ? 's' : ''} due
                    within the next 7 days.
                  </p>
                  <div className="space-y-3">
                    {duePayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-black/10 p-4"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {formatCurrency(Number(payment.amount))}
                          </p>
                          <p className="text-xs text-amber-100/75">
                            Due: {payment.dueDate ? formatDate(payment.dueDate) : 'N/A'}
                          </p>
                          <p className="text-xs text-amber-200/65">
                            Ref: {payment.paymentReference}
                          </p>
                        </div>
                        <Link href={`/portal/payments/${payment.id}/pay`}>
                          <Button
                            size="sm"
                            className="bg-amber-300 text-slate-950 hover:bg-amber-200"
                          >
                            <DollarSign className="mr-1 h-4 w-4" />
                            Pay Now
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="portal-panel h-full">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="portal-eyebrow mb-3">Service</div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Wrench className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Maintenance</span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-white/60">
                    Your maintenance requests and reported issues.
                  </CardDescription>
                </div>
                <MaintenanceRequestDialog
                  open={maintenanceDialogOpen}
                  onOpenChange={setMaintenanceDialogOpen}
                  onSubmitted={() => {
                    queryClient.invalidateQueries({ queryKey: ['tenant-portal'] });
                    queryClient.invalidateQueries({ queryKey: ['tenant-maintenance'] });
                  }}
                  triggerLabel="New"
                  triggerClassName="bg-sky-400 text-slate-950 hover:bg-sky-300"
                />
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {maintenanceRequests.length > 0 ? (
                <div className="flex flex-1 flex-col gap-4">
                  {maintenanceRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div>
                        <p className="font-medium text-white">{request.title}</p>
                        <p className="mt-1 text-xs text-white/55">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          request.status === 'COMPLETED'
                            ? 'default'
                            : request.status === 'IN_PROGRESS'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="border-white/10 bg-white/[0.06] text-white"
                      >
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/portal/maintenance" className="mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      View All Requests
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="portal-empty-state flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                  <CheckCircle className="mx-auto mb-3 h-8 w-8 text-white/45" />
                  <p className="text-white/70">No maintenance requests</p>
                  <Link href="/portal/maintenance">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      View Requests
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="portal-panel h-full">
            <CardHeader className="pb-4">
              <div className="portal-eyebrow mb-3">Money</div>
              <CardTitle className="flex items-center gap-2 text-white">
                <DollarSign className="h-5 w-5" />
                Recent Payments
              </CardTitle>
              <CardDescription className="mt-2 text-white/60">
                Your latest recorded rent payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {recentPayments.length > 0 ? (
                <div className="flex flex-1 flex-col gap-4">
                  {recentPayments.slice(0, 3).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {formatCurrency(Number(payment.amount))}
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          {payment.paymentDate ? formatDate(payment.paymentDate) : 'N/A'}
                        </p>
                      </div>
                      <Badge
                        variant={payment.status === 'PAID' ? 'default' : 'secondary'}
                        className="border-white/10 bg-white/[0.06] text-white"
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/portal/payments" className="mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      View All Payments
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="portal-empty-state flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                  <Clock className="mx-auto mb-3 h-8 w-8 text-white/45" />
                  <p className="text-white/70">No payment history</p>
                  <Link href="/portal/payments">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      View Payments
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="portal-panel h-full">
            <CardHeader className="pb-4">
              <div className="portal-eyebrow mb-3">Records</div>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              <CardDescription className="mt-2 text-white/60">
                Access lease files, identification, and shared records.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <div className="portal-empty-state flex flex-1 flex-col justify-between gap-5 px-6 py-10 text-center">
                <div>
                  <FileText className="mx-auto mb-3 h-8 w-8 text-white/45" />
                  <p className="mx-auto max-w-xs text-sm text-white/65">
                    Access your lease agreements, identification, and other important documents
                  </p>
                </div>
                <Link href="/portal/documents">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    View All Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
}
