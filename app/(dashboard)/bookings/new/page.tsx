'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

const bookingSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  guestName: z.string().min(1, 'Guest name is required'),
  guestEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  guestPhone: z.string().optional(),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  numberOfGuests: z.number().min(1, 'At least 1 guest required'),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  status: z.string(),
  source: z.string(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

async function fetchProperties() {
  const response = await fetch('/api/properties');
  if (!response.ok) throw new Error('Failed to fetch properties');
  return response.json();
}

export default function NewBookingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      numberOfGuests: 1,
      totalAmount: 0,
      status: 'PENDING',
      source: 'DIRECT',
    },
  });

  const propertyId = watch('propertyId');
  const checkInDate = watch('checkInDate');
  const checkOutDate = watch('checkOutDate');

  // Check availability when property and dates are selected
  const { data: availability, isLoading: isCheckingAvailability } = useQuery({
    queryKey: ['availability', propertyId, checkInDate, checkOutDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/bookings/availability?propertyId=${propertyId}&checkIn=${checkInDate}&checkOut=${checkOutDate}`
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to check availability');
      }
      return response.json();
    },
    enabled: Boolean(propertyId && checkInDate && checkOutDate && checkInDate < checkOutDate),
  });

  // Calculate total amount based on property rate and nights
  useEffect(() => {
    if (propertyId && checkInDate && checkOutDate) {
      const property = properties?.find((p: { id: string }) => p.id === propertyId);
      if (property && property.dailyRate) {
        const nights = Math.ceil(
          (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (nights > 0) {
          setValue('totalAmount', Number(property.dailyRate) * nights);
        }
      }
    }
  }, [propertyId, checkInDate, checkOutDate, properties, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          guestEmail: data.guestEmail || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
      }
      return response.json();
    },
    onSuccess: () => {
      router.push('/bookings');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: BookingFormData) => {
    setError(null);
    createMutation.mutate(data);
  };

  const selectedProperty = properties?.find((p: { id: string }) => p.id === propertyId);

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Booking" description="Create a new reservation">
        <Button variant="outline" asChild>
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">{error}</div>
        )}

        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Property</CardTitle>
            <CardDescription>Select the property for this booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property *</Label>
              <select
                id="propertyId"
                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                {...register('propertyId')}
              >
                <option value="">Select a property</option>
                {properties?.map(
                  (property: {
                    id: string;
                    name: string;
                    city: string;
                    dailyRate: number | null;
                  }) => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.city}
                      {property.dailyRate &&
                        ` (${formatCurrency(Number(property.dailyRate))}/night)`}
                    </option>
                  )
                )}
              </select>
              {errors.propertyId && (
                <p className="text-destructive text-sm">{errors.propertyId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

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
                <Input id="guestName" placeholder="John Smith" {...register('guestName')} />
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
                <Input
                  id="guestEmail"
                  type="email"
                  placeholder="john@example.com"
                  {...register('guestEmail')}
                />
                {errors.guestEmail && (
                  <p className="text-destructive text-sm">{errors.guestEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestPhone">Phone</Label>
                <Input id="guestPhone" placeholder="+27 82 123 4567" {...register('guestPhone')} />
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

            {checkInDate && checkOutDate && (
              <p className="text-muted-foreground text-sm">
                {Math.ceil(
                  (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                nights
              </p>
            )}

            {/* Availability Status */}
            {propertyId && checkInDate && checkOutDate && checkInDate < checkOutDate && (
              <div className="mt-4 rounded-lg border p-4">
                {isCheckingAvailability ? (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Checking availability...</span>
                  </div>
                ) : availability?.available ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Available</p>
                      <p className="text-sm text-green-600/80">
                        {availability.propertyName} is available for {availability.nights} nights
                      </p>
                    </div>
                  </div>
                ) : availability?.reason ? (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Stay Restriction</p>
                      <p className="text-sm text-yellow-600/80">{availability.reason}</p>
                    </div>
                  </div>
                ) : availability?.conflicts && availability.conflicts.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Not Available</p>
                        <p className="text-sm text-red-600/80">Conflicts with existing bookings:</p>
                      </div>
                    </div>
                    <ul className="text-muted-foreground ml-7 space-y-1 text-sm">
                      {availability.conflicts.map(
                        (conflict: {
                          id: string;
                          guestName: string;
                          checkInDate: string;
                          checkOutDate: string;
                        }) => (
                          <li key={conflict.id}>
                            {conflict.guestName}: {formatDate(conflict.checkInDate)} -{' '}
                            {formatDate(conflict.checkOutDate)}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Status, source, and payment information</CardDescription>
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
                placeholder="Any special requests from the guest..."
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                {...register('specialRequests')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Notes for internal use..."
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          {availability && !availability.available && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                Warning: This booking conflicts with existing reservations. Proceed with caution.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/bookings">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || isCheckingAvailability}
              variant={availability && !availability.available ? 'destructive' : 'default'}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : isCheckingAvailability ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : availability && !availability.available ? (
                'Create Anyway'
              ) : (
                'Create Booking'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
