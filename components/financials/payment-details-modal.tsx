'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  CreditCard,
  User,
  Building2,
  FileText,
  DollarSign,
  Download,
  Mail,
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
    payment.tenant?.email &&
    payment.paymentType === 'RENT';

  const canMarkAsPaid =
    payment.status !== 'PAID' &&
    payment.status !== 'REFUNDED' &&
    (payment.status === 'PENDING' ||
      payment.status === 'OVERDUE' ||
      payment.status === 'PARTIALLY_PAID');

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
                {payment.status.replace('_', ' ')}
              </Badge>
              {payment.reminderSent && (
                <Badge variant="secondary" className="text-xs">
                  Reminder Sent
                </Badge>
              )}
            </div>
          </div>

          <Separator />

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
