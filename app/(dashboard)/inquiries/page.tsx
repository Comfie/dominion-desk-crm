'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MessageSquare } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { InquiryCard } from '@/components/inquiries/inquiry-card';

async function fetchInquiries(filters: Record<string, string>) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/inquiries?${params}`);
  if (!response.ok) throw new Error('Failed to fetch inquiries');
  return response.json();
}

export default function InquiriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const { data: inquiries, isLoading } = useQuery({
    queryKey: [
      'inquiries',
      { search, status: statusFilter, priority: priorityFilter, source: sourceFilter },
    ],
    queryFn: () =>
      fetchInquiries({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(sourceFilter && { source: sourceFilter }),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/inquiries/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete inquiry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this inquiry?')) {
      deleteMutation.mutate(id);
    }
  };

  // Count inquiries by status
  const statusCounts = inquiries?.reduce(
    (acc: Record<string, number>, inquiry: { status: string }) => {
      acc[inquiry.status] = (acc[inquiry.status] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Inquiries" description="Manage inquiries and leads from all sources">
        <Button asChild>
          <Link href="/inquiries/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Inquiry
          </Link>
        </Button>
      </PageHeader>

      {/* Quick Stats */}
      {statusCounts && (
        <div className="flex flex-wrap gap-4">
          <div className="bg-muted rounded-lg px-4 py-2">
            <span className="text-muted-foreground text-sm">New: </span>
            <span className="font-semibold">{statusCounts.NEW || 0}</span>
          </div>
          <div className="bg-muted rounded-lg px-4 py-2">
            <span className="text-muted-foreground text-sm">In Progress: </span>
            <span className="font-semibold">{statusCounts.IN_PROGRESS || 0}</span>
          </div>
          <div className="bg-muted rounded-lg px-4 py-2">
            <span className="text-muted-foreground text-sm">Responded: </span>
            <span className="font-semibold">{statusCounts.RESPONDED || 0}</span>
          </div>
          <div className="bg-muted rounded-lg px-4 py-2">
            <span className="text-muted-foreground text-sm">Converted: </span>
            <span className="font-semibold">{statusCounts.CONVERTED || 0}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESPONDED">Responded</option>
            <option value="CONVERTED">Converted</option>
            <option value="CLOSED">Closed</option>
            <option value="SPAM">Spam</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Sources</option>
            <option value="DIRECT">Direct</option>
            <option value="AIRBNB">Airbnb</option>
            <option value="BOOKING_COM">Booking.com</option>
            <option value="WEBSITE">Website</option>
            <option value="PHONE">Phone</option>
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="REFERRAL">Referral</option>
          </select>
        </div>
      </div>

      {/* Inquiries Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : inquiries?.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inquiries.map(
            (inquiry: {
              id: string;
              contactName: string;
              contactEmail: string;
              contactPhone: string | null;
              message: string;
              inquirySource: string;
              inquiryType: string;
              status: string;
              priority: string;
              checkInDate: string | null;
              checkOutDate: string | null;
              numberOfGuests: number | null;
              createdAt: string;
              property: {
                id: string;
                name: string;
                city: string;
              } | null;
            }) => (
              <InquiryCard key={inquiry.id} inquiry={inquiry} onDelete={handleDelete} />
            )
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <MessageSquare className="text-muted-foreground/50 h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No inquiries found</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            {search || statusFilter || priorityFilter || sourceFilter
              ? 'Try adjusting your filters'
              : 'Inquiries from your properties will appear here'}
          </p>
          {!search && !statusFilter && !priorityFilter && !sourceFilter && (
            <Button asChild className="mt-4">
              <Link href="/inquiries/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Inquiry
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
