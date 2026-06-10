'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  ClipboardList,
  Home,
  Image as ImageIcon,
  MapPin,
  Search,
} from 'lucide-react';

import { PortalShell } from '@/components/portal/portal-shell';
import { MaintenanceRequestDialog } from '@/components/portal/maintenance-request-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  resolutionNotes: string | null;
  images: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }> | null;
  createdAt: string;
  property: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  };
};

type MaintenanceData = {
  tenant: {
    id: string;
    name: string;
  };
  property: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  } | null;
  requests: MaintenanceRequest[];
  summary: {
    total: number;
    pending: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const priorityStyles: Record<string, string> = {
  LOW: 'bg-slate-500/10 text-slate-300 border-slate-400/20',
  NORMAL: 'bg-sky-500/10 text-sky-300 border-sky-400/20',
  HIGH: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
  URGENT: 'bg-red-500/10 text-red-300 border-red-400/20',
};

const statusStyles: Record<string, string> = {
  PENDING: 'bg-white/5 text-white/80 border-white/10',
  SCHEDULED: 'bg-blue-500/10 text-blue-300 border-blue-400/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
  CANCELLED: 'bg-red-500/10 text-red-300 border-red-400/20',
};

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="portal-stat-card">
      <CardHeader className="pb-2">
        <CardDescription className="text-white/55">{label}</CardDescription>
        <CardTitle className="text-2xl text-white">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-white/60">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function TenantMaintenancePage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery<MaintenanceData>({
    queryKey: ['tenant-maintenance'],
    queryFn: async () => {
      const response = await fetch('/api/portal/maintenance');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch maintenance requests');
      }
      return response.json();
    },
  });

  const filteredRequests =
    data?.requests.filter((request) => {
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
      const normalizedQuery = searchQuery.trim().toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 ||
        request.title.toLowerCase().includes(normalizedQuery) ||
        request.description.toLowerCase().includes(normalizedQuery) ||
        request.category.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesSearch;
    }) || [];

  if (isLoading) {
    return (
      <PortalShell>
        <div className="portal-page">
          <Skeleton className="h-6 w-44 rounded-full bg-white/10" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-60 rounded-full bg-white/10" />
            <Skeleton className="h-5 w-full max-w-xl rounded-full bg-white/10" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-28 rounded-[1.35rem] bg-white/10" />
            <Skeleton className="h-28 rounded-[1.35rem] bg-white/10" />
            <Skeleton className="h-28 rounded-[1.35rem] bg-white/10" />
            <Skeleton className="h-28 rounded-[1.35rem] bg-white/10" />
          </div>
          <Skeleton className="h-96 rounded-[1.5rem] bg-white/10" />
        </div>
      </PortalShell>
    );
  }

  if (error || !data) {
    return (
      <PortalShell>
        <Card className="portal-panel mx-auto max-w-xl">
          <CardContent className="py-10 text-center">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-white/45" />
            <h1 className="mb-2 text-xl font-semibold">Unable to load maintenance requests</h1>
            <p className="mb-6 text-sm text-white/65">
              {error instanceof Error
                ? error.message
                : 'Your maintenance requests could not be loaded.'}
            </p>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['tenant-maintenance'] })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="portal-page">
        <div className="portal-page-header">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/portal/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>Maintenance</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="portal-hero">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <span className="portal-kicker">Maintenance center</span>
                <div className="space-y-2">
                  <h1 className="portal-page-title">Maintenance Requests</h1>
                  <p className="portal-page-description">
                    Track issues you&apos;ve reported, check scheduling updates, and submit new
                    maintenance requests without leaving the portal.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="portal-stat-card min-w-[10rem] px-4 py-3">
                  <p className="portal-eyebrow">Open work</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {data.summary.pending + data.summary.scheduled + data.summary.inProgress}
                  </p>
                </div>
                <MaintenanceRequestDialog
                  open={requestDialogOpen}
                  onOpenChange={setRequestDialogOpen}
                  onSubmitted={() => {
                    queryClient.invalidateQueries({ queryKey: ['tenant-maintenance'] });
                    queryClient.invalidateQueries({ queryKey: ['tenant-portal'] });
                  }}
                  triggerLabel="New Request"
                  triggerClassName="bg-sky-400 text-slate-950 hover:bg-sky-300"
                />
              </div>
            </div>
          </div>
        </div>

        {data.property ? (
          <Card className="portal-panel">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <Home className="h-4 w-4" />
                  Linked Property
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">{data.property.name}</p>
                  <p className="text-sm text-white/55">
                    {[data.property.address, data.property.city].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
              <p className="max-w-xl text-sm text-white/60">
                New requests are submitted against your active rental property so your landlord can
                track and resolve them in one place.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="All Requests"
            value={data.summary.total}
            description="Every issue you have submitted"
          />
          <SummaryCard
            label="Open"
            value={data.summary.pending + data.summary.scheduled + data.summary.inProgress}
            description="Pending, scheduled, or in progress"
          />
          <SummaryCard
            label="Completed"
            value={data.summary.completed}
            description="Resolved maintenance issues"
          />
          <SummaryCard
            label="Cancelled"
            value={data.summary.cancelled}
            description="Requests that were closed without work"
          />
        </div>

        <Card className="portal-panel-muted portal-panel">
          <CardContent className="p-4">
            <div className="portal-toolbar">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title, description, or category..."
                  className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/35"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {['ALL', 'PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    className={
                      statusFilter === status
                        ? 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                        : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                    }
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'ALL' ? 'All' : statusLabels[status]}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card className="portal-panel portal-empty-state">
              <CardContent className="py-14 text-center">
                <ClipboardList className="mx-auto mb-4 h-12 w-12 text-white/35" />
                <h2 className="mb-2 text-lg font-semibold text-white">
                  No maintenance requests found
                </h2>
                <p className="mx-auto max-w-md text-sm text-white/60">
                  {data.requests.length === 0
                    ? 'You have not submitted any maintenance requests yet.'
                    : 'No requests match your current search or filter.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="portal-panel">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-white">{request.title}</h2>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[request.status] || statusStyles.PENDING}`}
                        >
                          {statusLabels[request.status] || request.status}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityStyles[request.priority] || priorityStyles.NORMAL}`}
                        >
                          {request.priority}
                        </span>
                      </div>
                      <p className="max-w-3xl text-sm text-white/65">{request.description}</p>
                    </div>

                    <div className="text-sm text-white/50">
                      Reported {formatDate(request.createdAt)}
                    </div>
                  </div>

                  {request.images && request.images.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-white/75">
                        <ImageIcon className="h-4 w-4" />
                        {request.images.length} photo{request.images.length === 1 ? '' : 's'}{' '}
                        attached
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {request.images.map((image) => (
                          <a
                            key={image.url}
                            href={image.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                          >
                            <img
                              src={image.url}
                              alt={image.name}
                              className="h-20 w-20 object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="mb-1 text-xs tracking-wide text-white/45 uppercase">Category</p>
                      <p className="font-medium text-white">{request.category.replace('_', ' ')}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="mb-1 text-xs tracking-wide text-white/45 uppercase">Property</p>
                      <p className="font-medium text-white">{request.property.name}</p>
                      {(request.property.address || request.property.city) && (
                        <p className="mt-1 text-xs text-white/50">
                          {[request.property.address, request.property.city]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="mb-1 text-xs tracking-wide text-white/45 uppercase">Schedule</p>
                      <div className="flex items-center gap-2 text-white/72">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {request.scheduledDate
                            ? formatDate(request.scheduledDate)
                            : 'Not scheduled yet'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="mb-1 text-xs tracking-wide text-white/45 uppercase">Location</p>
                      <div className="flex items-center gap-2 text-white/72">
                        <MapPin className="h-4 w-4" />
                        <span>{request.location || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {request.resolutionNotes ? (
                    <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/5 p-4">
                      <p className="mb-1 text-xs font-semibold tracking-wide text-emerald-300 uppercase">
                        Resolution Notes
                      </p>
                      <p className="text-sm text-emerald-100/90">{request.resolutionNotes}</p>
                    </div>
                  ) : null}

                  {request.completedDate ? (
                    <p className="text-sm text-white/55">
                      Completed on {formatDate(request.completedDate)}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PortalShell>
  );
}
