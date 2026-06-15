'use client';

import { use, useEffect, useState } from 'react';
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
  PlayCircle,
  XCircle,
  Loader2,
  CheckSquare,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [actualCost, setActualCost] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
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
    onSuccess: (updatedRequest) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setAssignedTo(updatedRequest.assignedTo || '');
      setScheduledDate(
        updatedRequest.scheduledDate
          ? new Date(updatedRequest.scheduledDate).toISOString().slice(0, 16)
          : ''
      );
      setEstimatedCost(updatedRequest.estimatedCost ? String(updatedRequest.estimatedCost) : '');
      setActualCost(updatedRequest.actualCost ? String(updatedRequest.actualCost) : '');
      setResolutionNotes(updatedRequest.resolutionNotes || '');
      toast({
        title: 'Maintenance request updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: error.message || 'Failed to update maintenance request',
        variant: 'destructive',
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/maintenance/${id}/create-task`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create task');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] });
      toast({
        title: 'Task created',
        description: 'The maintenance task is now linked to this request.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: error.message || 'Failed to create task',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!request) {
      return;
    }

    setAssignedTo(request.assignedTo || '');
    setScheduledDate(
      request.scheduledDate ? new Date(request.scheduledDate).toISOString().slice(0, 16) : ''
    );
    setEstimatedCost(request.estimatedCost ? String(request.estimatedCost) : '');
    setActualCost(request.actualCost ? String(request.actualCost) : '');
    setResolutionNotes(request.resolutionNotes || '');
  }, [request]);

  const handleStatusChange = (status: string) => {
    const data: Record<string, unknown> = { status };
    if (status === 'COMPLETED') {
      data.completedDate = new Date().toISOString();
      if (actualCost) data.actualCost = parseFloat(actualCost);
      if (resolutionNotes) data.resolutionNotes = resolutionNotes;
    }
    updateMutation.mutate(data);
  };

  const handleSaveOperations = () => {
    updateMutation.mutate({
      assignedTo: assignedTo.trim() || undefined,
      scheduledDate: scheduledDate || undefined,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
    });
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

          {request.workflow && (
            <Alert className="border-orange-200 bg-orange-50/70 text-orange-950 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-100">
              <AlertTitle className="dark:text-orange-100">{request.workflow.label}</AlertTitle>
              <AlertDescription className="space-y-2 dark:text-orange-100/85">
                <p>{request.workflow.guidance}</p>
                <p className="text-orange-900/75 dark:text-orange-100/70">
                  Open for {request.workflow.ageDays} day{request.workflow.ageDays === 1 ? '' : 's'}
                  {request.workflow.daysPastSchedule > 0
                    ? `, ${request.workflow.daysPastSchedule} day${request.workflow.daysPastSchedule === 1 ? '' : 's'} past the planned visit`
                    : request.workflow.staleDays >= 3
                      ? `, ${request.workflow.staleDays} day${request.workflow.staleDays === 1 ? '' : 's'} since the last update`
                      : ''}
                  .
                </p>
                {request.workflow.task ? (
                  <Link
                    href={`/tasks/${request.workflow.task.id}`}
                    className="text-sm font-medium text-orange-950 underline underline-offset-4 dark:text-orange-100"
                  >
                    Open workflow task
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-orange-950 dark:text-orange-100">
                    No workflow task has been created yet.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Operations</CardTitle>
              <CardDescription>
                Assign the job, set an ETA, and record expected cost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Contractor or staff owner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost (R)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="Enter estimate"
                />
              </div>
              <Button onClick={handleSaveOperations} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Ops Details'
                )}
              </Button>
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

          {request.images && request.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>
                  Uploaded by the tenant with the maintenance request.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {request.images.map(
                    (image: { url: string; name: string; size: number; type: string }) => (
                      <a
                        key={image.url}
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group bg-muted overflow-hidden rounded-lg border"
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </a>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Linked Task */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.tasks && request.tasks.length > 0 ? (
                <div className="space-y-3">
                  {request.tasks.slice(0, 3).map((task: any) => (
                    <div key={task.id} className="space-y-2 rounded-md border p-3">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="hover:text-primary block font-medium transition-colors"
                      >
                        {task.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={task.status === 'COMPLETED' ? 'default' : 'outline'}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">{task.taskType.replace('_', ' ')}</Badge>
                      </div>
                      {task.dueDate && (
                        <p className="text-muted-foreground text-xs">
                          Due {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                  ))}
                  {request.tasks.length > 3 && (
                    <Link
                      href="/tasks?relatedType=maintenance"
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      View all maintenance tasks
                    </Link>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Workflow tasks keep assignment, ETA, and close-out work visible.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    {request.workflow ? 'No workflow task yet for this request.' : 'No linked task'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => createTaskMutation.mutate()}
                    disabled={createTaskMutation.isPending}
                  >
                    {createTaskMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Create Task
                      </>
                    )}
                  </Button>
                  {createTaskMutation.isError && (
                    <p className="text-destructive text-xs">
                      {createTaskMutation.error?.message || 'Failed to create task'}
                    </p>
                  )}
                  {request.workflow && (
                    <p className="text-muted-foreground text-xs">
                      The bulk workflow generator on the maintenance list can create the targeted
                      ops task for this stage.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
