'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ClipboardCheck, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Inspection {
  id: string;
  inspectionType: string;
  status: string;
  overallCondition: string | null;
  scheduledDate: string;
  completedDate: string | null;
  inspector: string | null;
  property: { id: string; name: string; address: string };
  tenant: { id: string; firstName: string; lastName: string } | null;
  _count: { items: number };
}

async function fetchInspections(filters: Record<string, string>, page = 1) {
  const params = new URLSearchParams({ ...filters, page: page.toString() });
  const response = await fetch(`/api/inspections?${params}`);
  if (!response.ok) throw new Error('Failed to fetch inspections');
  return response.json();
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-500/10 text-blue-500',
  IN_PROGRESS: 'bg-yellow-500/10 text-yellow-500',
  COMPLETED: 'bg-green-500/10 text-green-500',
  CANCELLED: 'bg-gray-500/10 text-gray-500',
};

const conditionColors: Record<string, string> = {
  EXCELLENT: 'bg-green-500',
  GOOD: 'bg-lime-500',
  FAIR: 'bg-yellow-500',
  POOR: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

const typeLabels: Record<string, string> = {
  MOVE_IN: 'Move In',
  MOVE_OUT: 'Move Out',
  ROUTINE: 'Routine',
  MAINTENANCE: 'Maintenance',
  ANNUAL: 'Annual',
  PRE_PURCHASE: 'Pre-purchase',
};

export default function InspectionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', { status: statusFilter, type: typeFilter, page }],
    queryFn: () =>
      fetchInspections(
        {
          ...(statusFilter && { status: statusFilter }),
          ...(typeFilter && { type: typeFilter }),
        },
        page
      ),
  });

  const inspections = data?.data || [];
  const pagination = data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/inspections/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete inspection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      setDeleteDialogOpen(false);
      setInspectionToDelete(null);
      toast({
        title: 'Inspection deleted',
        description: 'The inspection has been deleted successfully.',
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
    setInspectionToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Count by status
  const statusCounts = inspections?.reduce((acc: Record<string, number>, insp: Inspection) => {
    acc[insp.status] = (acc[insp.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspections"
        description="Manage property inspections and condition reports"
      >
        <Button asChild>
          <Link href="/inspections/new">
            <Plus className="mr-2 h-4 w-4" />
            New Inspection
          </Link>
        </Button>
      </PageHeader>

      {/* Quick Stats */}
      {statusCounts && Object.keys(statusCounts).length > 0 && (
        <div className="flex flex-wrap gap-4">
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
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Types</option>
            <option value="MOVE_IN">Move In</option>
            <option value="MOVE_OUT">Move Out</option>
            <option value="ROUTINE">Routine</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="ANNUAL">Annual</option>
            <option value="PRE_PURCHASE">Pre-Purchase</option>
          </select>
        </div>
      </div>

      {/* Inspections Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : inspections.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inspections.map((inspection: Inspection) => (
              <Card key={inspection.id} className="relative overflow-hidden">
                {inspection.overallCondition && (
                  <div
                    className={`absolute top-0 right-0 h-2 w-16 ${conditionColors[inspection.overallCondition]}`}
                  />
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{inspection.property.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {inspection.property.address}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[inspection.status]}>
                      {inspection.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">
                      {typeLabels[inspection.inspectionType] || inspection.inspectionType}
                    </Badge>
                    {inspection._count.items > 0 && (
                      <span className="text-muted-foreground">{inspection._count.items} items</span>
                    )}
                  </div>

                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {inspection.completedDate
                        ? `Completed ${format(new Date(inspection.completedDate), 'PP')}`
                        : `Scheduled ${format(new Date(inspection.scheduledDate), 'PP')}`}
                    </span>
                  </div>

                  {inspection.tenant && (
                    <div className="text-muted-foreground text-sm">
                      Tenant: {inspection.tenant.firstName} {inspection.tenant.lastName}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/inspections/${inspection.id}`}>View</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(inspection.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <ClipboardCheck className="text-muted-foreground/50 h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No inspections</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            {statusFilter || typeFilter
              ? 'Try adjusting your filters'
              : 'Create an inspection to get started'}
          </p>
          {!statusFilter && !typeFilter && (
            <Button asChild className="mt-4">
              <Link href="/inspections/new">
                <Plus className="mr-2 h-4 w-4" />
                New Inspection
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inspection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inspection? This will also delete all inspection
              items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => inspectionToDelete && deleteMutation.mutate(inspectionToDelete)}
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
