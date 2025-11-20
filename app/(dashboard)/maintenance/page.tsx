'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Wrench } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MaintenanceCard } from '@/components/maintenance/maintenance-card';

async function fetchMaintenanceRequests(filters: Record<string, string>) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/maintenance?${params}`);
  if (!response.ok) throw new Error('Failed to fetch maintenance requests');
  return response.json();
}

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: [
      'maintenance',
      { search, status: statusFilter, priority: priorityFilter, category: categoryFilter },
    ],
    queryFn: () =>
      fetchMaintenanceRequests({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete maintenance request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this maintenance request?')) {
      deleteMutation.mutate(id);
    }
  };

  // Count requests by status
  const statusCounts = requests?.reduce((acc: Record<string, number>, req: { status: string }) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" description="Track and manage property maintenance requests">
        <Button asChild>
          <Link href="/maintenance/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </PageHeader>

      {/* Quick Stats */}
      {statusCounts && (
        <div className="flex flex-wrap gap-4">
          <div className="bg-muted rounded-lg px-4 py-2">
            <span className="text-muted-foreground text-sm">Pending: </span>
            <span className="font-semibold">{statusCounts.PENDING || 0}</span>
          </div>
          <div className="bg-muted rounded-lg px-4 py-2">
            <span className="text-muted-foreground text-sm">Scheduled: </span>
            <span className="font-semibold">{statusCounts.SCHEDULED || 0}</span>
          </div>
          <div className="bg-muted rounded-lg px-4 py-2">
            <span className="text-muted-foreground text-sm">In Progress: </span>
            <span className="font-semibold">{statusCounts.IN_PROGRESS || 0}</span>
          </div>
          <div className="bg-muted rounded-lg px-4 py-2">
            <span className="text-muted-foreground text-sm">Completed: </span>
            <span className="font-semibold">{statusCounts.COMPLETED || 0}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search requests..."
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
            <option value="PENDING">Pending</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Categories</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="HVAC">HVAC</option>
            <option value="APPLIANCE">Appliance</option>
            <option value="STRUCTURAL">Structural</option>
            <option value="PAINTING">Painting</option>
            <option value="CLEANING">Cleaning</option>
            <option value="LANDSCAPING">Landscaping</option>
            <option value="PEST_CONTROL">Pest Control</option>
            <option value="SECURITY">Security</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Requests Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : requests?.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map(
            (request: {
              id: string;
              title: string;
              description: string;
              category: string;
              status: string;
              priority: string;
              scheduledDate: string | null;
              estimatedCost: number | null;
              actualCost: number | null;
              assignedTo: string | null;
              createdAt: string;
              property: {
                id: string;
                name: string;
                city: string;
              };
              tenant: {
                id: string;
                firstName: string;
                lastName: string;
              } | null;
            }) => (
              <MaintenanceCard key={request.id} request={request} onDelete={handleDelete} />
            )
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Wrench className="text-muted-foreground/50 h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No maintenance requests</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            {search || statusFilter || priorityFilter || categoryFilter
              ? 'Try adjusting your filters'
              : 'Create a request to track property maintenance'}
          </p>
          {!search && !statusFilter && !priorityFilter && !categoryFilter && (
            <Button asChild className="mt-4">
              <Link href="/maintenance/new">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
