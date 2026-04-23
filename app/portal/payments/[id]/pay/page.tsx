'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import {
  ArrowLeft,
  LogOut,
  CreditCard,
  Landmark,
  Calendar,
  Shield,
  Loader2,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/ui/logo';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

type PaymentMethod = 'card' | 'eft' | null;

interface PaymentDetails {
  id: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  status: string;
  description: string | null;
  paymentReference: string;
  transactionFeePercentage: number;
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
    bankName: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
    bankBranchCode: string | null;
    paymentInstructions: string | null;
  };
  onlinePaymentAvailable: boolean;
}

export default function PaymentCheckoutPage() {
  const params = useParams();
  const { toast } = useToast();
  const paymentId = params.id as string;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    data: payment,
    isLoading,
    error,
  } = useQuery<PaymentDetails>({
    queryKey: ['tenant-payment', paymentId],
    queryFn: async () => {
      const response = await fetch(`/api/tenant/payments/${paymentId}`);
      if (!response.ok) throw new Error('Failed to fetch payment');
      return response.json();
    },
  });

  const initiatePaystackPayment = useMutation({
    mutationFn: async () => {
      // Calculate amount with fee for card payments
      const amountToCharge = selectedMethod === 'card' && payment ? totalWithFee : payment?.amount;

      const response = await fetch('/api/tenant/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          amount: amountToCharge,
          email: payment?.user.email,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize payment');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authorizationUrl) {
        // Redirect to Paystack checkout
        window.location.assign(data.authorizationUrl);
      } else {
        toast({
          title: 'Payment initiated',
          description: 'Redirecting to payment gateway...',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: 'Copied!',
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePayNow = () => {
    if (selectedMethod === 'card') {
      initiatePaystackPayment.mutate();
    } else if (selectedMethod === 'eft') {
      // For EFT, just scroll to bank details or show confirmation
      toast({
        title: 'EFT Payment',
        description:
          'Please use the bank details below to make your payment, then upload proof of payment.',
      });
    }
  };

  const canPay = payment?.status === 'PENDING' || payment?.status === 'OVERDUE';
  const landlordName =
    payment?.user.companyName ||
    `${payment?.user.firstName || ''} ${payment?.user.lastName || ''}`.trim() ||
    'Landlord';

  // Calculate transaction fee for card payments
  const transactionFee =
    selectedMethod === 'card' && payment
      ? Math.round((Number(payment.amount) * payment.transactionFeePercentage) / 100)
      : 0;
  const totalWithFee = payment ? Number(payment.amount) + transactionFee : 0;

  if (isLoading) {
    return (
      <div className="bg-background dark min-h-screen" style={{ colorScheme: 'dark' }}>
        <header className="bg-gradient-header border-b border-white/10 shadow-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div
        className="bg-background dark flex min-h-screen items-center justify-center"
        style={{ colorScheme: 'dark' }}
      >
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">
              Payment not found or you don&apos;t have access.
            </p>
            <Button asChild>
              <Link href="/portal/payments">Back to Payments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background dark flex min-h-screen flex-col" style={{ colorScheme: 'dark' }}>
      {/* Header */}
      <header className="bg-gradient-header border-b border-white/10 shadow-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-4">
          <Link href="/portal/payments" className="flex items-center gap-2">
            <Logo variant="icon" width={28} height={28} />
            <span className="text-lg font-semibold text-white">Checkout</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <Link href="/portal/payments">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Button>
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground text-sm">Amount Due</p>
                  <p className="text-3xl font-bold">
                    {payment.currency} {Number(payment.amount).toFixed(2)}
                  </p>
                </div>

                {selectedMethod === 'card' && transactionFee > 0 && (
                  <>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/50">
                      <p className="mb-2 text-xs font-medium text-blue-800 dark:text-blue-200">
                        Online Payment Fee
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">
                            Transaction Fee ({payment.transactionFeePercentage}%)
                          </span>
                          <span className="font-medium text-blue-900 dark:text-blue-100">
                            {payment.currency} {transactionFee.toFixed(2)}
                          </span>
                        </div>
                        <Separator className="bg-blue-200 dark:bg-blue-800" />
                        <div className="flex justify-between font-bold">
                          <span className="text-blue-900 dark:text-blue-100">Total to Pay</span>
                          <span className="text-blue-900 dark:text-blue-100">
                            {payment.currency} {totalWithFee.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description</span>
                    <span className="font-medium">{payment.description || 'Rent Payment'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono text-xs">{payment.paymentReference}</span>
                  </div>
                  {payment.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date</span>
                      <span
                        className={payment.status === 'OVERDUE' ? 'font-medium text-red-600' : ''}
                      >
                        {formatDate(payment.dueDate)}
                      </span>
                    </div>
                  )}
                  {payment.property && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property</span>
                      <span className="text-right">{payment.property.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payable To</span>
                    <span>{landlordName}</span>
                  </div>
                </div>

                {payment.status === 'OVERDUE' && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Overdue - Please pay immediately
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6 lg:col-span-2">
            {!canPay ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
                  <h3 className="mb-2 text-lg font-semibold">Payment Already Processed</h3>
                  <p className="text-muted-foreground">
                    This payment has already been {payment.status.toLowerCase()}.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/portal/payments">View All Payments</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Select Payment Method</CardTitle>
                    <CardDescription>Choose how you&apos;d like to pay</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Card Payment Option */}
                    <div
                      className={`rounded-lg border-2 p-4 transition-all ${
                        payment.onlinePaymentAvailable
                          ? selectedMethod === 'card'
                            ? 'border-primary bg-primary/5 cursor-pointer'
                            : 'border-border hover:border-primary/50 cursor-pointer'
                          : 'border-border bg-muted/40 cursor-not-allowed opacity-60'
                      }`}
                      onClick={() => {
                        if (payment.onlinePaymentAvailable) {
                          setSelectedMethod('card');
                        }
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`rounded-full p-3 ${
                            selectedMethod === 'card'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <CreditCard className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Pay with Card</h3>
                          <p className="text-muted-foreground text-sm">
                            {payment.onlinePaymentAvailable
                              ? 'Credit or Debit Card via Paystack'
                              : 'Temporarily unavailable for this payment'}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground text-xs">Secure payment</span>
                          </div>
                          {payment.transactionFeePercentage > 0 && (
                            <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                              <strong>Note:</strong> A {payment.transactionFeePercentage}% service
                              fee ({payment.currency} {transactionFee.toFixed(2)}) will be added for
                              card payments.
                            </div>
                          )}
                          {!payment.onlinePaymentAvailable && (
                            <div className="mt-2 rounded border border-dashed px-2 py-1 text-xs">
                              Use EFT and upload proof of payment instead.
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <div className="flex h-5 w-8 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">
                            VISA
                          </div>
                          <div className="flex h-5 w-8 items-center justify-center rounded bg-red-500 text-xs font-bold text-white">
                            MC
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EFT Payment Option */}
                    <div
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        selectedMethod === 'eft'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedMethod('eft')}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`rounded-full p-3 ${
                            selectedMethod === 'eft'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <Landmark className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Bank Transfer (EFT)</h3>
                          <p className="text-muted-foreground text-sm">
                            Pay directly from your bank account
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Calendar className="text-muted-foreground h-4 w-4" />
                            <span className="text-muted-foreground text-xs">1-2 business days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bank Details for EFT */}
                {selectedMethod === 'eft' && payment.user.bankAccountNumber && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5" />
                        Bank Details
                      </CardTitle>
                      <CardDescription>Use these details to make your EFT payment</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted/50 space-y-3 rounded-lg p-4">
                        {payment.user.bankName && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Bank</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{payment.user.bankName}</span>
                            </div>
                          </div>
                        )}
                        {payment.user.bankAccountName && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Account Name</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{payment.user.bankAccountName}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  copyToClipboard(payment.user.bankAccountName!, 'Account Name')
                                }
                              >
                                {copiedField === 'Account Name' ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">
                              {payment.user.bankAccountNumber}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                copyToClipboard(payment.user.bankAccountNumber!, 'Account Number')
                              }
                            >
                              {copiedField === 'Account Number' ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {payment.user.bankBranchCode && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Branch Code</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">
                                {payment.user.bankBranchCode}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  copyToClipboard(payment.user.bankBranchCode!, 'Branch Code')
                                }
                              >
                                {copiedField === 'Branch Code' ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Reference</span>
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-mono font-medium">
                              {payment.paymentReference}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(payment.paymentReference, 'Reference')}
                            >
                              {copiedField === 'Reference' ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {payment.currency} {Number(payment.amount).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                copyToClipboard(Number(payment.amount).toFixed(2), 'Amount')
                              }
                            >
                              {copiedField === 'Amount' ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {payment.user.paymentInstructions && (
                        <div className="text-muted-foreground rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                          <p className="mb-1 font-medium text-amber-800 dark:text-amber-200">
                            Important:
                          </p>
                          <p className="text-amber-700 dark:text-amber-300">
                            {payment.user.paymentInstructions}
                          </p>
                        </div>
                      )}

                      <div className="text-muted-foreground text-sm">
                        After making your payment, please{' '}
                        <Link href={`/portal/payments`} className="text-primary hover:underline">
                          upload your proof of payment
                        </Link>{' '}
                        so your landlord can verify it.
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pay Button */}
                <div className="flex gap-4">
                  {selectedMethod === 'card' && (
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handlePayNow}
                      disabled={
                        initiatePaystackPayment.isPending || !payment.onlinePaymentAvailable
                      }
                    >
                      {initiatePaystackPayment.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay {payment.currency}{' '}
                          {selectedMethod === 'card'
                            ? totalWithFee.toFixed(2)
                            : Number(payment.amount).toFixed(2)}
                        </>
                      )}
                    </Button>
                  )}
                  {selectedMethod === 'eft' && (
                    <Button className="flex-1" size="lg" variant="outline" asChild>
                      <Link href="/portal/payments">
                        <ExternalLink className="mr-2 h-5 w-5" />
                        Upload Proof of Payment
                      </Link>
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            <span>Secure payment powered by Paystack</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
