'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  CreditCard,
  User,
  Building2,
  FileText,
  DollarSign,
  Mail,
  FileCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface PaymentDetailsModalProps {
  payment: {
    id: string;
    paymentReference: string;
    paymentType: string;
    amount: number;
    currency?: string;
    paymentMethod: string;
    paymentDate: string;
    dueDate?: string | null;
    status: string;
    description?: string | null;
    notes?: string | null;
    reminderSent?: boolean;
    reminderSentAt?: string | null;
    proofOfPaymentUrl?: string | null;
    proofOfPaymentName?: string | null;
    proofUploadedAt?: string | null;
    proofNotes?: string | null;
    verifiedAt?: string | null;
    verifiedBy?: string | null;
    verificationNotes?: string | null;
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
      email?: string;
      properties?: {
        property: {
          id: string;
          name: string;
          address?: string | null;
        };
      }[];
    } | null;
    property?: {
      id: string;
      name: string;
      address?: string | null;
    } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PENDING_VERIFICATION: 'bg-blue-100 text-blue-800',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
  FAILED: 'bg-red-100 text-red-800',
};

const paymentTypeLabels: Record<string, string> = {
  RENT: 'Rent',
  DEPOSIT: 'Deposit',
  BOOKING: 'Booking',
  CLEANING_FEE: 'Cleaning Fee',
  UTILITIES: 'Utilities',
  LATE_FEE: 'Late Fee',
  DAMAGE: 'Damage',
  REFUND: 'Refund',
  OTHER: 'Other',
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Cash',
  EFT: 'EFT',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  PAYSTACK: 'Paystack',
  PAYPAL: 'PayPal',
  OTHER: 'Other',
};

export function PaymentDetailsModal({ payment, open, onOpenChange }: PaymentDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  const sendReminder = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(`/api/payments/${paymentId}/send-reminder`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reminder');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reminder sent',
        description: 'Payment reminder has been sent to the tenant',
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAID',
          paymentDate: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark payment as paid');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payment updated',
        description: 'Payment has been marked as paid',
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const verifyPayment = useMutation({
    mutationFn: async ({
      paymentId,
      action,
    }: {
      paymentId: string;
      action: 'approve' | 'reject';
    }) => {
      const response = await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes: verificationNotes || undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} payment`);
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.action === 'approve' ? 'Payment approved' : 'Payment rejected',
        description:
          variables.action === 'approve'
            ? 'Payment has been verified and marked as paid'
            : 'Payment proof has been rejected. The tenant will be notified.',
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setVerificationNotes('');
      setShowVerifyForm(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!payment) return null;

  const payer =
    payment.booking?.guestName ||
    (payment.tenant ? `${payment.tenant.firstName} ${payment.tenant.lastName}` : 'Unknown');

  // Get property from multiple sources: direct property link, booking property, or tenant's assigned property
  const propertyName =
    payment.property?.name ||
    payment.booking?.property?.name ||
    payment.tenant?.properties?.[0]?.property?.name ||
    'No property';

  const propertyAddress =
    payment.property?.address || payment.tenant?.properties?.[0]?.property?.address || null;

  const canSendReminder =
    payment.status !== 'PAID' &&
    payment.status !== 'REFUNDED' &&
    payment.status !== 'PENDING_VERIFICATION' &&
    payment.tenant?.email &&
    payment.paymentType === 'RENT';

  const canMarkAsPaid =
    payment.status !== 'PAID' &&
    payment.status !== 'REFUNDED' &&
    payment.status !== 'PENDING_VERIFICATION' &&
    (payment.status === 'PENDING' ||
      payment.status === 'OVERDUE' ||
      payment.status === 'PARTIALLY_PAID');

  const isPendingVerification = payment.status === 'PENDING_VERIFICATION';
  const hasProof = !!payment.proofOfPaymentUrl;

  const getStatusDisplay = (status: string) => {
    if (status === 'PENDING_VERIFICATION') {
      return 'AWAITING VERIFICATION';
    }
    return status.replace('_', ' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with amount and status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {payment.currency || 'ZAR'} {Number(payment.amount).toFixed(2)}
              </div>
              <p className="text-muted-foreground text-sm">Ref: {payment.paymentReference}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={statusColors[payment.status] || statusColors.PENDING}>
                {getStatusDisplay(payment.status)}
              </Badge>
              {payment.reminderSent && (
                <Badge variant="secondary" className="text-xs">
                  Reminder Sent
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Proof of Payment Verification Section */}
          {isPendingVerification && hasProof && (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
                <div className="flex items-start gap-3">
                  <FileCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Payment Proof Uploaded
                    </p>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      {payer} has uploaded proof of payment for verification.
                    </p>
                    {payment.proofUploadedAt && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        Uploaded on {formatDate(payment.proofUploadedAt)}
                      </p>
                    )}
                    {payment.proofNotes && (
                      <p className="mt-2 text-sm text-blue-700 italic dark:text-blue-300">
                        Note from tenant: "{payment.proofNotes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(payment.proofOfPaymentUrl!, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Proof of Payment
                    {payment.proofOfPaymentName && (
                      <span className="text-muted-foreground ml-2">
                        ({payment.proofOfPaymentName})
                      </span>
                    )}
                  </Button>

                  {!showVerifyForm ? (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          verifyPayment.mutate({ paymentId: payment.id, action: 'approve' })
                        }
                        disabled={verifyPayment.isPending}
                      >
                        {verifyPayment.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Approve & Mark as Paid
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => setShowVerifyForm(true)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label htmlFor="rejection-notes">Rejection reason (optional)</Label>
                      <Textarea
                        id="rejection-notes"
                        placeholder="Explain why the proof is being rejected..."
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() =>
                            verifyPayment.mutate({ paymentId: payment.id, action: 'reject' })
                          }
                          disabled={verifyPayment.isPending}
                        >
                          {verifyPayment.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Confirm Rejection
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowVerifyForm(false);
                            setVerificationNotes('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Payment Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold">Payment Information</h3>

              <div className="flex items-start gap-3">
                <FileText className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Type</p>
                  <p className="font-medium">
                    {paymentTypeLabels[payment.paymentType] || payment.paymentType}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Payment Method</p>
                  <p className="font-medium">
                    {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Payment Date</p>
                  <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                </div>
              </div>

              {payment.dueDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-sm">Due Date</p>
                    <p className="font-medium">{formatDate(payment.dueDate)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Related Information</h3>

              <div className="flex items-start gap-3">
                <User className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Payer</p>
                  <p className="font-medium">{payer}</p>
                  {payment.tenant?.email && (
                    <p className="text-muted-foreground text-sm">{payment.tenant.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Property</p>
                  <p className="font-medium">{propertyName}</p>
                  {propertyAddress && (
                    <p className="text-muted-foreground text-sm">{propertyAddress}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Proof of Payment Information (for approved/paid payments) */}
          {payment.status === 'PAID' && hasProof && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Proof of Payment</h3>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/50">
                  <div className="flex items-start gap-3">
                    <FileCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Payment Verified
                      </p>
                      {payment.proofUploadedAt && (
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Proof uploaded on {formatDate(payment.proofUploadedAt)}
                        </p>
                      )}
                      {payment.verifiedAt && (
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Verified on {formatDate(payment.verifiedAt)}
                        </p>
                      )}
                      {payment.proofNotes && (
                        <p className="text-sm text-green-700 italic dark:text-green-300">
                          Note from tenant: "{payment.proofNotes}"
                        </p>
                      )}
                      {payment.verificationNotes && (
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Verification notes: "{payment.verificationNotes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(payment.proofOfPaymentUrl!, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Proof of Payment
                      {payment.proofOfPaymentName && (
                        <span className="text-muted-foreground ml-2">
                          ({payment.proofOfPaymentName})
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Description or Notes */}
          {(payment.description || payment.notes) && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold">
                  {payment.description ? 'Description' : 'Notes'}
                </h3>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {payment.description || payment.notes}
                </p>
              </div>
            </>
          )}

          {/* Reminder Information */}
          {payment.reminderSentAt && (
            <>
              <Separator />
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                <span>Reminder sent on {formatDate(payment.reminderSentAt)}</span>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex justify-end gap-2">
            {canMarkAsPaid && (
              <Button
                variant="default"
                onClick={() => markAsPaid.mutate(payment.id)}
                disabled={markAsPaid.isPending}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                {markAsPaid.isPending ? 'Updating...' : 'Mark as Paid'}
              </Button>
            )}
            {canSendReminder && (
              <Button
                variant="outline"
                onClick={() => sendReminder.mutate(payment.id)}
                disabled={sendReminder.isPending}
              >
                <Mail className="mr-2 h-4 w-4" />
                {sendReminder.isPending ? 'Sending...' : 'Send Reminder'}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
