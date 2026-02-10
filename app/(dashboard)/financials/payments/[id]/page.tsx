'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Download,
  Calendar,
  CreditCard,
  User,
  Home,
  FileText,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared';

const statusColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
  PENDING_VERIFICATION: 'bg-blue-100 text-blue-800',
};

const formatCurrency = (amount: number | string) => {
  return `R${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
};

const formatDate = (date: string | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatPaymentType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatPaymentMethod = (method: string | null) => {
  if (!method) return '—';
  return method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const {
    data: payment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      const res = await fetch(`/api/payments/${id}`);
      if (!res.ok) throw new Error('Failed to fetch payment');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            Payment not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const tenantName = payment.tenant
    ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
    : payment.booking?.guestName || '—';

  const propertyName = payment.booking?.property?.name || payment.propertyId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Details</h1>
          {payment.invoiceNumber && (
            <p className="text-muted-foreground">{payment.invoiceNumber}</p>
          )}
        </div>
        <Badge className={statusColors[payment.status] || 'bg-gray-100 text-gray-800'}>
          {formatPaymentType(payment.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" /> Amount
              </span>
              <span className="text-lg font-semibold">{formatCurrency(payment.amount)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" /> Type
              </span>
              <span className="text-sm">{formatPaymentType(payment.paymentType)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" /> Method
              </span>
              <span className="text-sm">{formatPaymentMethod(payment.paymentMethod)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" /> Due Date
              </span>
              <span className="text-sm">{formatDate(payment.dueDate)}</span>
            </div>
            {payment.paymentDate && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" /> Payment Date
                  </span>
                  <span className="text-sm">{formatDate(payment.paymentDate)}</span>
                </div>
              </>
            )}
            {payment.bankReference && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4" /> Reference
                  </span>
                  <span className="font-mono text-sm">{payment.bankReference}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenant & Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <User className="h-4 w-4" /> Tenant
              </span>
              <span className="text-sm">{tenantName}</span>
            </div>
            {payment.tenant?.email && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Email</span>
                  <span className="text-sm">{payment.tenant.email}</span>
                </div>
              </>
            )}
            {payment.tenant?.phone && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Phone</span>
                  <span className="text-sm">{payment.tenant.phone}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Home className="h-4 w-4" /> Property
              </span>
              <span className="text-sm">{propertyName}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {(payment.description || payment.notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {payment.description && (
              <p className="text-sm whitespace-pre-wrap">{payment.description}</p>
            )}
            {payment.notes && payment.description && <Separator className="my-3" />}
            {payment.notes && (
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{payment.notes}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
