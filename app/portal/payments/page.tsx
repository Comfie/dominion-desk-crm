'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Download,
  AlertCircle,
  LogOut,
  DollarSign,
  ArrowLeft,
  Upload,
  FileCheck,
  CheckCircle2,
  Clock,
  Eye,
  CreditCard,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/ui/logo';
import { PaymentDetailModal } from '@/components/portal/payment-detail-modal';
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

  const getStatusBadge = (status: string, hasProof?: boolean) => {
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
        className: 'bg-green-600',
        icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
      },
      PENDING: {
        variant: 'secondary',
        className: 'bg-yellow-600',
        icon: <Clock className="mr-1 h-3 w-3" />,
      },
      PENDING_VERIFICATION: {
        variant: 'secondary',
        className: 'bg-blue-600',
        icon: <FileCheck className="mr-1 h-3 w-3" />,
      },
      OVERDUE: { variant: 'destructive', className: 'bg-red-600' },
      PARTIALLY_PAID: { variant: 'secondary', className: 'bg-orange-600' },
      FAILED: { variant: 'destructive', className: 'bg-red-700' },
    };

    const statusConfig = config[status] || config.PENDING;
    const displayStatus =
      status === 'PENDING_VERIFICATION' ? 'Awaiting Verification' : status.replace('_', ' ');

    return (
      <Badge
        variant={statusConfig.variant}
        className={`${statusConfig.className} flex items-center`}
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

  const overduePayments = data?.payments?.filter((p: Payment) => p.status === 'OVERDUE') || [];
  const pendingPayments = data?.payments?.filter((p: Payment) => p.status === 'PENDING') || [];
  const pendingVerificationPayments =
    data?.payments?.filter((p: Payment) => p.status === 'PENDING_VERIFICATION') || [];

  const totalOverdue = overduePayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-gradient-header border-b border-white/10 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4">
          <Link href="/portal/dashboard" className="flex items-center gap-2">
            <Logo variant="icon" width={28} height={28} />
            <span className="hidden text-lg font-semibold text-white sm:inline">Tenant Portal</span>
            <span className="text-lg font-semibold text-white sm:hidden">Portal</span>
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6">
          <Link href="/portal/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">My Payments</h1>
          <p className="text-muted-foreground">
            View your rent payments, upload proof of payment, and download invoices
          </p>
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

        {/* Alert for pending verification */}
        {pendingVerificationPayments.length > 0 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
            <FileCheck className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              You have {pendingVerificationPayments.length} payment
              {pendingVerificationPayments.length > 1 ? 's' : ''} awaiting verification by your
              landlord.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
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
              <CardDescription>Awaiting Verification</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                {pendingVerificationPayments.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Proof{pendingVerificationPayments.length !== 1 ? 's' : ''} submitted
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
            <CardDescription>
              Click on a payment to view details or upload proof of payment
            </CardDescription>
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
                    className="hover:bg-muted/50 cursor-pointer rounded-lg border p-4 transition-colors"
                    onClick={() => handleViewPayment(payment)}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Payment Info */}
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-start gap-2">
                          <h3 className="font-semibold">{payment.description || 'Rent Payment'}</h3>
                          {getStatusBadge(payment.status, !!payment.proofOfPaymentUrl)}
                          {payment.proofOfPaymentUrl &&
                            payment.status !== 'PENDING_VERIFICATION' &&
                            payment.status !== 'PAID' && (
                              <Badge variant="outline" className="text-xs">
                                <Upload className="mr-1 h-3 w-3" />
                                Proof Uploaded
                              </Badge>
                            )}
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
                            {payment.paymentDate && payment.status === 'PAID' && (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
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

                        <div className="flex flex-wrap gap-2">
                          {(payment.status === 'PENDING' || payment.status === 'OVERDUE') && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/portal/payments/${payment.id}/pay`;
                                }}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Pay Now
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
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
                            onClick={(e) => {
                              e.stopPropagation();
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

        {/* Help Section */}
        {data?.payments && data.payments.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>How to pay:</strong> Click "View Invoice" on any payment to see full banking
                details and payment instructions.
              </p>
              <p>
                <strong>After making a payment:</strong> Click "Upload Proof" to submit your proof
                of payment (bank transfer confirmation, deposit slip, etc.). Your landlord will
                verify it and mark the payment as complete.
              </p>
              <p>
                <strong>Need help?</strong> Contact your landlord at{' '}
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
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-border bg-background border-t py-6">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} DominionDesk. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        payment={selectedPayment}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        onProofUploaded={handleProofUploaded}
      />
    </div>
  );
}
