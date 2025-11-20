'use client';

import Link from 'next/link';
import { DollarSign, CreditCard, Calendar, Building2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
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
  const payer =
    payment.booking?.guestName ||
    (payment.tenant ? `${payment.tenant.firstName} ${payment.tenant.lastName}` : 'Unknown');
  const propertyName = payment.booking?.property?.name || 'No property';

  return (
    <Link href={`/financials/income/${payment.id}`}>
      <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{payer}</h3>
                <Badge variant="outline" className="text-xs">
                  {paymentTypeLabels[payment.paymentType] || payment.paymentType}
                </Badge>
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
                  <span>{formatDate(payment.paymentDate)}</span>
                </div>
              </div>

              <p className="text-muted-foreground text-xs">Ref: {payment.paymentReference}</p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-lg font-bold">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(Number(payment.amount))}
              </div>
              <Badge className={`${statusColors[payment.status]} mt-1`}>
                {payment.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
