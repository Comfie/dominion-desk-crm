'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  AlertCircle,
  DollarSign,
  Upload,
  FileCheck,
  CheckCircle2,
  Clock,
  Eye,
  CreditCard,
  Home,
  ChevronRight,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { PaymentDetailModal } from '@/components/portal/payment-detail-modal';
import { PortalShell } from '@/components/portal/portal-shell';
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
  proofOfPaymentUrl?: string | null;
  proofOfPaymentName?: string | null;
  proofUploadedAt?: string | null;
  proofNotes?: string | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
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

function SummaryCard({
  label,
  value,
  description,
  toneClassName,
}: {
  label: string;
  value: string | number;
  description: string;
  toneClassName?: string;
}) {
  return (
    <Card className="portal-stat-card">
      <CardHeader className="pb-3">
        <CardDescription className="text-white/55">{label}</CardDescription>
        <CardTitle className={`text-2xl text-white ${toneClassName || ''}`}>{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-white/60">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function TenantPaymentsPage() {
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data, isLoading } = useQuery<TenantPaymentsData>({
    queryKey: ['tenant-payments'],
    queryFn: async () => {
      const response = await fetch('/api/tenant/payments');
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        variant: 'default' | 'secondary' | 'destructive';
        className: string;
        icon?: React.ReactNode;
      }
    > = {
      PAID: {
        variant: 'default',
        className: 'border-emerald-400/20 bg-emerald-500/15 text-emerald-200',
        icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
      },
      PENDING: {
        variant: 'secondary',
        className: 'border-amber-400/20 bg-amber-500/15 text-amber-200',
        icon: <Clock className="mr-1 h-3 w-3" />,
      },
      PENDING_VERIFICATION: {
        variant: 'secondary',
        className: 'border-blue-400/20 bg-blue-500/15 text-blue-200',
        icon: <FileCheck className="mr-1 h-3 w-3" />,
      },
      OVERDUE: {
        variant: 'destructive',
        className: 'border-red-400/20 bg-red-500/15 text-red-200',
      },
      PARTIALLY_PAID: {
        variant: 'secondary',
        className: 'border-orange-400/20 bg-orange-500/15 text-orange-200',
      },
      FAILED: {
        variant: 'destructive',
        className: 'border-red-400/20 bg-red-600/20 text-red-200',
      },
    };

    const statusConfig = config[status] || config.PENDING;
    const displayStatus =
      status === 'PENDING_VERIFICATION' ? 'Awaiting Verification' : status.replace('_', ' ');

    return (
      <Badge
        variant={statusConfig.variant}
        className={`${statusConfig.className} flex items-center border`}
      >
        {statusConfig.icon}
        {displayStatus}
      </Badge>
    );
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  const handleProofUploaded = () => {
    queryClient.invalidateQueries({ queryKey: ['tenant-payments'] });
  };

  const overduePayments = data?.payments?.filter((payment) => payment.status === 'OVERDUE') || [];
  const pendingPayments = data?.payments?.filter((payment) => payment.status === 'PENDING') || [];
  const pendingVerificationPayments =
    data?.payments?.filter((payment) => payment.status === 'PENDING_VERIFICATION') || [];

  const totalOverdue = overduePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalPending = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <PortalShell>
      <div className="portal-page">
        <div className="portal-page-header">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/portal/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>My Payments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="portal-hero">
            <div className="space-y-4">
              <span className="portal-kicker">Payment center</span>
              <div className="space-y-2">
                <h1 className="portal-page-title">My Payments</h1>
                <p className="portal-page-description">
                  Review rent history, upload proof of payment, and follow verification updates in
                  one place.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  label="Total Overdue"
                  value={formatCurrency(totalOverdue)}
                  description={`${overduePayments.length} payment${overduePayments.length !== 1 ? 's' : ''}`}
                  toneClassName="text-red-200"
                />
                <SummaryCard
                  label="Pending Payments"
                  value={formatCurrency(totalPending)}
                  description={`${pendingPayments.length} payment${pendingPayments.length !== 1 ? 's' : ''}`}
                  toneClassName="text-amber-200"
                />
                <SummaryCard
                  label="Awaiting Verification"
                  value={pendingVerificationPayments.length}
                  description={`Proof${pendingVerificationPayments.length !== 1 ? 's' : ''} submitted`}
                  toneClassName="text-blue-200"
                />
                <SummaryCard
                  label="Total Payments"
                  value={data?.payments?.length || 0}
                  description="All time"
                />
              </div>
            </div>
          </div>
        </div>

        {overduePayments.length > 0 && (
          <Card className="portal-panel portal-status-danger">
            <CardContent className="flex gap-3 p-5">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-300" />
              <div className="text-sm text-red-100/85">
                You have {overduePayments.length} overdue payment
                {overduePayments.length > 1 ? 's' : ''} totaling{' '}
                <span className="font-semibold text-white">{formatCurrency(totalOverdue)}</span>.
                Please make payment as soon as possible.
              </div>
            </CardContent>
          </Card>
        )}

        {pendingVerificationPayments.length > 0 && (
          <Card className="portal-panel border-blue-400/20 bg-blue-500/10">
            <CardContent className="flex gap-3 p-5">
              <FileCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-300" />
              <div className="text-sm text-blue-100/85">
                You have {pendingVerificationPayments.length} payment
                {pendingVerificationPayments.length > 1 ? 's' : ''} awaiting verification by your
                landlord.
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="portal-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription className="text-white/60">
              Open any payment to review details, pay online, or upload proof.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <Skeleton className="mb-2 h-6 w-48 bg-white/10" />
                    <Skeleton className="h-4 w-64 bg-white/10" />
                  </div>
                ))
              ) : data?.payments?.length === 0 ? (
                <div className="portal-empty-state py-12 text-center">
                  <DollarSign className="mx-auto mb-4 h-12 w-12 text-white/35" />
                  <p className="text-lg font-medium text-white">No payments found</p>
                  <p className="text-sm text-white/60">Your payment history will appear here.</p>
                </div>
              ) : (
                data?.payments?.map((payment) => (
                  <div
                    key={payment.id}
                    className="cursor-pointer rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
                    onClick={() => handleViewPayment(payment)}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-start gap-2">
                          <h3 className="font-semibold text-white">
                            {payment.description || 'Rent Payment'}
                          </h3>
                          {getStatusBadge(payment.status)}
                          {payment.proofOfPaymentUrl &&
                            payment.status !== 'PENDING_VERIFICATION' &&
                            payment.status !== 'PAID' && (
                              <Badge
                                variant="outline"
                                className="border-white/10 bg-white/[0.04] text-xs text-white/75"
                              >
                                <Upload className="mr-1 h-3 w-3" />
                                Proof Uploaded
                              </Badge>
                            )}
                        </div>

                        <div className="space-y-2 text-sm text-white/60">
                          {payment.property && (
                            <p>
                              <span className="font-medium text-white/80">Property:</span>{' '}
                              {payment.property.name}
                              {payment.property.address && ` - ${payment.property.address}`}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4">
                            {payment.dueDate && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Due: {formatDate(payment.dueDate)}</span>
                              </div>
                            )}
                            {payment.paymentDate && payment.status === 'PAID' && (
                              <div className="flex items-center gap-1.5 text-emerald-200">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Paid: {formatDate(payment.paymentDate)}</span>
                              </div>
                            )}
                          </div>

                          <p>
                            <span className="font-medium text-white/80">Reference:</span>{' '}
                            {payment.paymentReference}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 xl:items-end">
                        <div className="text-left xl:text-right">
                          <div className="text-2xl font-bold text-white">
                            {payment.currency} {Number(payment.amount).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(payment.status === 'PENDING' || payment.status === 'OVERDUE') && (
                            <>
                              <Button
                                size="sm"
                                className="bg-sky-400 text-slate-950 hover:bg-sky-300"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  window.location.href = `/portal/payments/${payment.id}/pay`;
                                }}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Pay Now
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleViewPayment(payment);
                                }}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Proof
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white/75 hover:bg-white/[0.08] hover:text-white"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleViewPayment(payment);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {data?.payments && data.payments.length > 0 && (
          <Card className="portal-panel-muted portal-panel">
            <CardHeader>
              <CardTitle className="text-white">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/65">
              <p>
                <span className="font-semibold text-white">How to pay:</span> Open a payment to see
                full banking details and invoice instructions.
              </p>
              <p>
                <span className="font-semibold text-white">After making a payment:</span> Upload
                proof so your landlord can verify it and mark the payment as complete.
              </p>
              <p>
                <span className="font-semibold text-white">Need help?</span> Contact your landlord
                at{' '}
                <a
                  href={`mailto:${data.payments[0]?.user.email}`}
                  className="text-sky-300 hover:text-sky-200 hover:underline"
                >
                  {data.payments[0]?.user.email}
                </a>
                {data.payments[0]?.user.phone && (
                  <>
                    {' '}
                    or call{' '}
                    <a
                      href={`tel:${data.payments[0].user.phone}`}
                      className="text-sky-300 hover:text-sky-200 hover:underline"
                    >
                      {data.payments[0].user.phone}
                    </a>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <PaymentDetailModal
        payment={selectedPayment}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        onProofUploaded={handleProofUploaded}
      />
    </PortalShell>
  );
}
