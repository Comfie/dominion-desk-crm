'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Home,
  Calendar,
  User,
  Wrench,
  DollarSign,
  MapPin,
  CheckCircle,
  Clock,
  PlayCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatCurrency } from '@/lib/utils';

async function fetchMaintenanceRequest(id: string) {
  const response = await fetch(`/api/maintenance/${id}`);
  if (!response.ok) throw new Error('Failed to fetch maintenance request');
  return response.json();
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  STRUCTURAL: 'Structural',
  PAINTING: 'Painting',
  CLEANING: 'Cleaning',
  LANDSCAPING: 'Landscaping',
  PEST_CONTROL: 'Pest Control',
  SECURITY: 'Security',
  OTHER: 'Other',
};

export default function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [actualCost, setActualCost] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const {
    data: request,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => fetchMaintenanceRequest(id),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update request');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const handleStatusChange = (status: string) => {
    const data: Record<string, unknown> = { status };
    if (status === 'COMPLETED') {
      data.completedDate = new Date().toISOString();
      if (actualCost) data.actualCost = parseFloat(actualCost);
      if (resolutionNotes) data.resolutionNotes = resolutionNotes;
    }
    updateMutation.mutate(data);
  };

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
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg">Maintenance request not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/maintenance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Maintenance
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={request.title} description={categoryLabels[request.category]}>
        <Button variant="outline" asChild>
          <Link href="/maintenance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status and Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusColors[request.status] || statusColors.PENDING}>
                    {request.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={priorityColors[request.priority]}>
                    {request.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {request.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange('SCHEDULED')}
                    disabled={updateMutation.isPending}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                )}
                {(request.status === 'PENDING' || request.status === 'SCHEDULED') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    disabled={updateMutation.isPending}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Work
                  </Button>
                )}
                {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange('CANCELLED')}
                    disabled={updateMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{request.description}</p>
              {request.location && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <MapPin className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Location: {request.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complete Request */}
          {request.status === 'IN_PROGRESS' && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Request</CardTitle>
                <CardDescription>Mark this request as completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="actualCost">Actual Cost (R)</Label>
                  <Input
                    id="actualCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    placeholder={
                      request.estimatedCost
                        ? `Estimated: ${formatCurrency(request.estimatedCost)}`
                        : 'Enter actual cost'
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                  <textarea
                    id="resolutionNotes"
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe what was done..."
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                  />
                </div>
                <Button
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Resolution (if completed) */}
          {request.status === 'COMPLETED' && request.resolutionNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
                {request.completedDate && (
                  <CardDescription>
                    Completed on {formatDate(request.completedDate)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{request.resolutionNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/properties/${request.property.id}`}
                className="hover:text-primary font-medium transition-colors"
              >
                {request.property.name}
              </Link>
              <p className="text-muted-foreground text-sm">
                {request.property.address}, {request.property.city}
              </p>
            </CardContent>
          </Card>

          {/* Tenant */}
          {request.tenant && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Reported By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/tenants/${request.tenant.id}`}
                  className="hover:text-primary font-medium transition-colors"
                >
                  {request.tenant.firstName} {request.tenant.lastName}
                </Link>
                {request.tenant.phone && (
                  <p className="text-muted-foreground text-sm">{request.tenant.phone}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assignment */}
          {request.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{request.assignedTo}</p>
              </CardContent>
            </Card>
          )}

          {/* Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {request.estimatedCost && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated</span>
                  <span>{formatCurrency(request.estimatedCost)}</span>
                </div>
              )}
              {request.actualCost && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Actual</span>
                  <span className="font-medium">{formatCurrency(request.actualCost)}</span>
                </div>
              )}
              {!request.estimatedCost && !request.actualCost && (
                <p className="text-muted-foreground text-sm">No costs recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          {request.scheduledDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{formatDate(request.scheduledDate)}</p>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(request.createdAt)}</span>
              </div>
              {request.assignedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned</span>
                  <span>{formatDate(request.assignedAt)}</span>
                </div>
              )}
              {request.completedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{formatDate(request.completedDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
