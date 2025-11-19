'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Mail,
  Phone,
  Home,
  DollarSign,
  Clock,
  MessageSquare,
  FileText,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';

async function fetchBooking(id: string) {
  const response = await fetch(`/api/bookings/${id}`);
  if (!response.ok) throw new Error('Failed to fetch booking');
  return response.json();
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  CHECKED_IN: 'bg-green-100 text-green-800 border-green-200',
  CHECKED_OUT: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  NO_SHOW: 'bg-purple-100 text-purple-800 border-purple-200',
};

const sourceLabels: Record<string, string> = {
  DIRECT: 'Direct',
  AIRBNB: 'Airbnb',
  BOOKING_COM: 'Booking.com',
  VRBO: 'VRBO',
  OTHER: 'Other',
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBooking(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
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

  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      <PageHeader title={booking.guestName} description={`Booking at ${booking.property.name}`}>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/bookings/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Booking
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status and Source */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Booking Status</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[booking.status] || statusColors.PENDING}>
                    {booking.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">{sourceLabels[booking.source]}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="text-muted-foreground text-sm">Check-in</p>
                    <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                    {booking.property.checkInTime && (
                      <p className="text-muted-foreground text-xs">
                        {booking.property.checkInTime}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="text-muted-foreground text-sm">Check-out</p>
                    <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                    {booking.property.checkOutTime && (
                      <p className="text-muted-foreground text-xs">
                        {booking.property.checkOutTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="text-muted-foreground text-sm">
                  Duration:{' '}
                  <span className="font-medium">
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Name</p>
                  <p className="font-medium">{booking.guestName}</p>
                </div>
              </div>

              {booking.guestEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="text-muted-foreground text-sm">Email</p>
                    <a
                      href={`mailto:${booking.guestEmail}`}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {booking.guestEmail}
                    </a>
                  </div>
                </div>
              )}

              {booking.guestPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="text-muted-foreground text-sm">Phone</p>
                    <a
                      href={`tel:${booking.guestPhone}`}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {booking.guestPhone}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <User className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Number of Guests</p>
                  <p className="font-medium">{booking.numberOfGuests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(booking.specialRequests || booking.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes & Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.specialRequests && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <MessageSquare className="text-muted-foreground h-4 w-4" />
                      <p className="text-sm font-medium">Special Requests</p>
                    </div>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {booking.specialRequests}
                    </p>
                  </div>
                )}

                {booking.specialRequests && booking.notes && <Separator />}

                {booking.notes && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <p className="text-sm font-medium">Internal Notes</p>
                    </div>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {booking.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(Number(booking.totalAmount))}
                </span>
              </div>

              {booking.payments && booking.payments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Payments</p>
                    {booking.payments.map(
                      (payment: {
                        id: string;
                        amount: number;
                        paymentDate: string;
                        paymentMethod: string;
                      }) => (
                        <div key={payment.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatDate(payment.paymentDate)}
                          </span>
                          <span>{formatCurrency(Number(payment.amount))}</span>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/properties/${booking.property.id}`}
                className="hover:text-primary font-medium transition-colors"
              >
                {booking.property.name}
              </Link>
              <p className="text-muted-foreground text-sm">{booking.property.address}</p>
              <p className="text-muted-foreground text-sm">
                {booking.property.city}, {booking.property.province}
              </p>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(booking.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(booking.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
