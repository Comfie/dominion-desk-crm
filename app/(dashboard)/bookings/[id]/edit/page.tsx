'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const bookingSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  guestEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  guestPhone: z.string().optional(),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  numberOfGuests: z.number().min(1, 'At least 1 guest required'),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  status: z.string(),
  source: z.string(),
  notes: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

async function fetchBooking(id: string) {
  const response = await fetch(`/api/bookings/${id}`);
  if (!response.ok) throw new Error('Failed to fetch booking');
  return response.json();
}

export default function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBooking(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  // Update form when booking data is loaded
  useEffect(() => {
    if (booking) {
      reset({
        guestName: booking.guestName,
        guestEmail: booking.guestEmail || '',
        guestPhone: booking.guestPhone || '',
        checkInDate: new Date(booking.checkInDate).toISOString().split('T')[0],
        checkOutDate: new Date(booking.checkOutDate).toISOString().split('T')[0],
        numberOfGuests: booking.numberOfGuests,
        totalAmount: Number(booking.totalAmount),
        status: booking.status,
        source: booking.source,
        notes: booking.notes || '',
        specialRequests: booking.specialRequests || '',
      });
    }
  }, [booking, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          guestEmail: data.guestEmail || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update booking');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      router.push(`/bookings/${id}`);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: BookingFormData) => {
    setError(null);
    updateMutation.mutate(data);
  };

  if (isLoadingBooking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg">Booking not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Booking" description={`Update booking for ${booking.guestName}`}>
        <Button variant="outline" asChild>
          <Link href={`/bookings/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">{error}</div>
        )}

        {/* Guest Information */}
        <Card>
          <CardHeader>
            <CardTitle>Guest Information</CardTitle>
            <CardDescription>Details about the guest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guestName">Guest Name *</Label>
                <Input id="guestName" {...register('guestName')} />
                {errors.guestName && (
                  <p className="text-destructive text-sm">{errors.guestName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfGuests">Number of Guests *</Label>
                <Input id="numberOfGuests" type="number" min="1" {...register('numberOfGuests')} />
                {errors.numberOfGuests && (
                  <p className="text-destructive text-sm">{errors.numberOfGuests.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email</Label>
                <Input id="guestEmail" type="email" {...register('guestEmail')} />
                {errors.guestEmail && (
                  <p className="text-destructive text-sm">{errors.guestEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestPhone">Phone</Label>
                <Input id="guestPhone" {...register('guestPhone')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Dates</CardTitle>
            <CardDescription>Check-in and check-out dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checkInDate">Check-in Date *</Label>
                <Input id="checkInDate" type="date" {...register('checkInDate')} />
                {errors.checkInDate && (
                  <p className="text-destructive text-sm">{errors.checkInDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOutDate">Check-out Date *</Label>
                <Input id="checkOutDate" type="date" {...register('checkOutDate')} />
                {errors.checkOutDate && (
                  <p className="text-destructive text-sm">{errors.checkOutDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Status, source, and payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('status')}
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="CHECKED_OUT">Checked Out</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <select
                  id="source"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('source')}
                >
                  <option value="DIRECT">Direct</option>
                  <option value="AIRBNB">Airbnb</option>
                  <option value="BOOKING_COM">Booking.com</option>
                  <option value="VRBO">VRBO</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount (R) *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('totalAmount')}
                />
                {errors.totalAmount && (
                  <p className="text-destructive text-sm">{errors.totalAmount.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <textarea
                id="specialRequests"
                rows={3}
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                {...register('specialRequests')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <textarea
                id="notes"
                rows={3}
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/bookings/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
