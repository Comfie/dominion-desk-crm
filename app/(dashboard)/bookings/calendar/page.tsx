'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, List, Calendar as CalendarIcon } from 'lucide-react';
import { SlotInfo } from 'react-big-calendar';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingCalendar } from '@/components/bookings/booking-calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BookingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  propertyId: string;
  propertyName: string;
  guestName: string;
  totalAmount: number;
}

async function fetchBookings(filters: Record<string, string>) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/bookings?${params}`);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
}

async function fetchProperties() {
  const response = await fetch('/api/properties');
  if (!response.ok) throw new Error('Failed to fetch properties');
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

export default function BookingsCalendarPage() {
  const router = useRouter();
  const [propertyFilter, setPropertyFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', { propertyId: propertyFilter }],
    queryFn: () =>
      fetchBookings({
        ...(propertyFilter && { propertyId: propertyFilter }),
      }),
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  const handleSelectEvent = (event: BookingEvent) => {
    setSelectedBooking(event);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    // Navigate to new booking with pre-filled dates
    const checkIn = slotInfo.start.toISOString().split('T')[0];
    const checkOut = slotInfo.end.toISOString().split('T')[0];
    router.push(
      `/bookings/new?checkIn=${checkIn}&checkOut=${checkOut}${propertyFilter ? `&propertyId=${propertyFilter}` : ''}`
    );
  };

  const nights = selectedBooking
    ? Math.ceil(
        (new Date(selectedBooking.end).getTime() - new Date(selectedBooking.start).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Booking Calendar" description="Visual overview of all your bookings">
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/bookings">
              <List className="mr-2 h-4 w-4" />
              List View
            </Link>
          </Button>
          <Button asChild>
            <Link href="/bookings/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Booking
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Property Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="property-filter" className="text-sm font-medium">
            Filter by Property:
          </label>
          <select
            id="property-filter"
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Properties</option>
            {properties?.map((property: { id: string; name: string }) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <Skeleton className="h-[700px] w-full rounded-lg" />
      ) : (
        <BookingCalendar
          bookings={bookings || []}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
        />
      )}

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBooking?.guestName}</DialogTitle>
            <DialogDescription>{selectedBooking?.propertyName}</DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedBooking.status] || statusColors.PENDING}>
                  {selectedBooking.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">Check-in</p>
                  <p className="font-medium">{formatDate(selectedBooking.start.toISOString())}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Check-out</p>
                  <p className="font-medium">{formatDate(selectedBooking.end.toISOString())}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">Duration</p>
                  <p className="font-medium">
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Amount</p>
                  <p className="font-medium">{formatCurrency(selectedBooking.totalAmount)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button asChild className="flex-1">
                  <Link href={`/bookings/${selectedBooking.id}`}>View Details</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/bookings/${selectedBooking.id}/edit`}>Edit</Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
