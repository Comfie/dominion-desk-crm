'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, CalendarDays } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { BookingCard } from '@/components/bookings/booking-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

async function fetchBookings(filters: Record<string, string>, page = 1) {
  const params = new URLSearchParams({ ...filters, page: page.toString() });
  const response = await fetch(`/api/bookings?${params}`);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
}

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', { search, status: statusFilter, source: sourceFilter, page }],
    queryFn: () =>
      fetchBookings(
        {
          ...(search && { search }),
          ...(statusFilter && { status: statusFilter }),
          ...(sourceFilter && { source: sourceFilter }),
        },
        page
      ),
  });

  const bookings = data?.data || [];
  const pagination = data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete booking');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
      toast({
        title: 'Booking deleted',
        description: 'The booking has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: string) => {
    setBookingToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Manage your property bookings and reservations">
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/bookings/calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Sources</option>
            <option value="DIRECT">Direct</option>
            <option value="AIRBNB">Airbnb</option>
            <option value="BOOKING_COM">Booking.com</option>
            <option value="VRBO">VRBO</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Bookings Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.map(
              (booking: {
                id: string;
                guestName: string;
                guestEmail: string | null;
                guestPhone: string | null;
                checkInDate: string;
                checkOutDate: string;
                numberOfGuests: number;
                totalAmount: number;
                status: string;
                source: string;
                property: {
                  id: string;
                  name: string;
                  address: string;
                  city: string;
                  primaryImageUrl: string | null;
                };
              }) => (
                <BookingCard key={booking.id} booking={booking} onDelete={handleDelete} />
              )
            )}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Calendar className="text-muted-foreground/50 h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No bookings found</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            {search || statusFilter || sourceFilter
              ? 'Try adjusting your filters'
              : 'Get started by creating your first booking'}
          </p>
          {!search && !statusFilter && !sourceFilter && (
            <Button asChild className="mt-4">
              <Link href="/bookings/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Booking
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookingToDelete && deleteMutation.mutate(bookingToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
