'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const paymentSchema = z.object({
  bookingId: z.string().optional(),
  tenantId: z.string().optional(),
  paymentType: z.string().min(1, 'Payment type is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  status: z.string(),
  notes: z.string().optional(),
  bankReference: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

async function fetchBookings() {
  const response = await fetch('/api/bookings');
  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
}

async function fetchTenants() {
  const response = await fetch('/api/tenants');
  if (!response.ok) throw new Error('Failed to fetch tenants');
  return response.json();
}

export default function NewPaymentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings,
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentType: 'BOOKING',
      paymentMethod: 'EFT',
      status: 'PAID',
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record payment');
      }
      return response.json();
    },
    onSuccess: () => {
      router.push('/financials/income');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    setError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Record Payment" description="Add a new payment record">
        <Button variant="outline" asChild>
          <Link href="/financials/income">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Enter payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type *</Label>
                <select
                  id="paymentType"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('paymentType')}
                >
                  <option value="BOOKING">Booking</option>
                  <option value="RENT">Rent</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="CLEANING_FEE">Cleaning Fee</option>
                  <option value="UTILITIES">Utilities</option>
                  <option value="LATE_FEE">Late Fee</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="REFUND">Refund</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.paymentType && (
                  <p className="text-destructive text-sm">{errors.paymentType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (R) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="text-destructive text-sm">{errors.amount.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <select
                  id="paymentMethod"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('paymentMethod')}
                >
                  <option value="EFT">EFT</option>
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="PAYSTACK">Paystack</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.paymentMethod && (
                  <p className="text-destructive text-sm">{errors.paymentMethod.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input id="paymentDate" type="date" {...register('paymentDate')} />
                {errors.paymentDate && (
                  <p className="text-destructive text-sm">{errors.paymentDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bookingId">Link to Booking</Label>
                <select
                  id="bookingId"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('bookingId')}
                >
                  <option value="">No booking</option>
                  {bookings?.map(
                    (booking: { id: string; guestName: string; property: { name: string } }) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.guestName} - {booking.property.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantId">Link to Tenant</Label>
                <select
                  id="tenantId"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('tenantId')}
                >
                  <option value="">No tenant</option>
                  {tenants?.map((tenant: { id: string; firstName: string; lastName: string }) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.firstName} {tenant.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('status')}
                >
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankReference">Bank Reference</Label>
                <Input
                  id="bankReference"
                  placeholder="Reference number"
                  {...register('bankReference')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Additional notes..."
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/financials/income">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              'Record Payment'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
