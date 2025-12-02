'use client';

import { useState } from 'react';
import { DollarSign, CreditCard, Calendar, Building2, Mail } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PaymentDetailsModal } from './payment-details-modal';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentCardProps {
  payment: {
    id: string;
    paymentReference: string;
    paymentType: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    status: string;
    dueDate?: string | null;
    reminderSent?: boolean;
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
  };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
  REFUNDED: 'bg-purple-100 text-purple-800 border-purple-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
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

export function PaymentCard({ payment }: PaymentCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const payer =
    payment.booking?.guestName ||
    (payment.tenant ? `${payment.tenant.firstName} ${payment.tenant.lastName}` : 'Unknown');

  // Get property from multiple sources: direct property link, booking property, or tenant's assigned property
  const propertyName =
    payment.property?.name ||
    payment.booking?.property?.name ||
    payment.tenant?.properties?.[0]?.property?.name ||
    'No property';

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
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const canSendReminder =
    payment.status !== 'PAID' &&
    payment.status !== 'REFUNDED' &&
    payment.tenant?.email &&
    payment.paymentType === 'RENT';

  const handleSendReminder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    sendReminder.mutate(payment.id);
  };

  return (
    <>
      <Card
        className="hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => setShowDetailsModal(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{payer}</h3>
                <Badge variant="outline" className="text-xs">
                  {paymentTypeLabels[payment.paymentType] || payment.paymentType}
                </Badge>
                {payment.reminderSent && (
                  <Badge variant="secondary" className="text-xs">
                    Reminder Sent
                  </Badge>
                )}
              </div>

              <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{propertyName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  <span>{paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {payment.dueDate
                      ? `Due: ${formatDate(payment.dueDate)}`
                      : formatDate(payment.paymentDate)}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground text-xs">Ref: {payment.paymentReference}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1 text-lg font-bold">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(Number(payment.amount))}
                </div>
                <Badge className={`${statusColors[payment.status]} mt-1`}>
                  {payment.status.replace('_', ' ')}
                </Badge>
              </div>

              {canSendReminder && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={sendReminder.isPending}
                  onClick={handleSendReminder}
                  className="mt-1"
                >
                  <Mail className="mr-1 h-3 w-3" />
                  {sendReminder.isPending ? 'Sending...' : 'Send Reminder'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentDetailsModal
        payment={payment}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </>
  );
}
