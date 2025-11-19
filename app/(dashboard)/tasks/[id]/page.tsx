'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Trash2,
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  taskType: z.string().min(1, 'Task type is required'),
  priority: z.string(),
  status: z.string(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  relatedType: z.string().optional(),
  relatedId: z.string().optional(),
  reminderDate: z.string().optional(),
  notes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const taskId = params.id as string;

  // Fetch task details
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) throw new Error('Failed to fetch task');
      return response.json();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  const relatedType = watch('relatedType');

  // Fetch related entities
  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    enabled: isEditing,
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await fetch('/api/tenants');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json();
    },
    enabled: isEditing,
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
    enabled: isEditing,
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const response = await fetch('/api/maintenance');
      if (!response.ok) throw new Error('Failed to fetch maintenance');
      return response.json();
    },
    enabled: isEditing,
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate || null,
          reminderDate: data.reminderDate || null,
          relatedType: data.relatedType || null,
          relatedId: data.relatedId || null,
          assignedTo: data.assignedTo || null,
          notes: data.notes || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsEditing(false);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete task');
      return response.json();
    },
    onSuccess: () => {
      router.push('/tasks');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Quick status update
  const quickStatusUpdate = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const startEditing = () => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        taskType: task.taskType,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
        assignedTo: task.assignedTo || '',
        relatedType: task.relatedType || '',
        relatedId: task.relatedId || '',
        reminderDate: task.reminderDate
          ? new Date(task.reminderDate).toISOString().slice(0, 16)
          : '',
        notes: task.notes || '',
      });
      setIsEditing(true);
    }
  };

  const onSubmit = (data: TaskFormData) => {
    setError(null);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Task not found</AlertDescription>
        </Alert>
        <Link href="/tasks">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
      </div>
    );
  }

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Edit Task' : task.title}
        description={isEditing ? 'Update task details' : task.description || 'Task details'}
      >
        <div className="flex gap-2">
          <Link href="/tasks">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          {!isEditing && (
            <>
              <Button onClick={startEditing}>Edit Task</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </PageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskType">Task Type *</Label>
                  <Select
                    defaultValue={task.taskType}
                    onValueChange={(value) => setValue('taskType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                      <SelectItem value="VIEWING">Viewing</SelectItem>
                      <SelectItem value="CHECK_IN">Check In</SelectItem>
                      <SelectItem value="CHECK_OUT">Check Out</SelectItem>
                      <SelectItem value="INSPECTION">Inspection</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="PAYMENT_REMINDER">Payment Reminder</SelectItem>
                      <SelectItem value="LEASE_RENEWAL">Lease Renewal</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    defaultValue={task.priority}
                    onValueChange={(value) => setValue('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    defaultValue={task.status}
                    onValueChange={(value) => setValue('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="datetime-local" {...register('dueDate')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminderDate">Reminder Date</Label>
                  <Input id="reminderDate" type="datetime-local" {...register('reminderDate')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input id="assignedTo" {...register('assignedTo')} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register('description')} rows={3} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Link to Entity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Related To</Label>
                  <Select
                    defaultValue={task.relatedType || ''}
                    onValueChange={(value) => {
                      setValue('relatedType', value);
                      setValue('relatedId', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="maintenance">Maintenance Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {relatedType === 'property' && (
                  <div className="space-y-2">
                    <Label>Property</Label>
                    <Select
                      defaultValue={task.relatedId || ''}
                      onValueChange={(value) => setValue('relatedId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertiesData?.properties?.map(
                          (property: { id: string; name: string }) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {relatedType === 'booking' && (
                  <div className="space-y-2">
                    <Label>Booking</Label>
                    <Select
                      defaultValue={task.relatedId || ''}
                      onValueChange={(value) => setValue('relatedId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookingsData?.bookings?.map(
                          (booking: {
                            id: string;
                            guestName: string;
                            property?: { name: string };
                          }) => (
                            <SelectItem key={booking.id} value={booking.id}>
                              {booking.guestName} - {booking.property?.name || 'Unknown'}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {relatedType === 'tenant' && (
                  <div className="space-y-2">
                    <Label>Tenant</Label>
                    <Select
                      defaultValue={task.relatedId || ''}
                      onValueChange={(value) => setValue('relatedId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenantsData?.tenants?.map(
                          (tenant: { id: string; firstName: string; lastName: string }) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.firstName} {tenant.lastName}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {relatedType === 'maintenance' && (
                  <div className="space-y-2">
                    <Label>Maintenance Request</Label>
                    <Select
                      defaultValue={task.relatedId || ''}
                      onValueChange={(value) => setValue('relatedId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select request" />
                      </SelectTrigger>
                      <SelectContent>
                        {maintenanceData?.requests?.map(
                          (request: { id: string; title: string }) => (
                            <SelectItem key={request.id} value={request.id}>
                              {request.title}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea {...register('notes')} rows={4} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {task.status !== 'TODO' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickStatusUpdate.mutate('TODO')}
                    disabled={quickStatusUpdate.isPending}
                  >
                    Mark as To Do
                  </Button>
                )}
                {task.status !== 'IN_PROGRESS' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickStatusUpdate.mutate('IN_PROGRESS')}
                    disabled={quickStatusUpdate.isPending}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    Start Progress
                  </Button>
                )}
                {task.status !== 'COMPLETED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickStatusUpdate.mutate('COMPLETED')}
                    disabled={quickStatusUpdate.isPending}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Mark Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground text-sm">Status</Label>
                  <div className="mt-1">
                    <Badge className={statusColors[task.status]}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Priority</Label>
                  <div className="mt-1">
                    <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Task Type</Label>
                  <p className="mt-1 font-medium">{task.taskType.replace(/_/g, ' ')}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Assigned To</Label>
                  <p className="mt-1 font-medium">{task.assignedTo || 'Unassigned'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Due Date</Label>
                  <p className={`mt-1 font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                    {isOverdue && ' (Overdue)'}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Reminder</Label>
                  <p className="mt-1 font-medium">
                    {task.reminderDate ? formatDate(task.reminderDate) : 'No reminder set'}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Created</Label>
                  <p className="mt-1 font-medium">{formatDate(task.createdAt)}</p>
                </div>

                {task.completedDate && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Completed</Label>
                    <p className="mt-1 font-medium">{formatDate(task.completedDate)}</p>
                  </div>
                )}
              </div>

              {task.description && (
                <div>
                  <Label className="text-muted-foreground text-sm">Description</Label>
                  <p className="mt-1">{task.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Entity */}
          {task.relatedEntity && (
            <Card>
              <CardHeader>
                <CardTitle>Related Entity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Building2 className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm capitalize">
                    {task.relatedType}:
                  </span>
                  {task.relatedType === 'property' && (
                    <Link
                      href={`/properties/${task.relatedId}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {task.relatedEntity.name}
                    </Link>
                  )}
                  {task.relatedType === 'booking' && (
                    <Link
                      href={`/bookings/${task.relatedId}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {task.relatedEntity.guestName} - {task.relatedEntity.property?.name}
                    </Link>
                  )}
                  {task.relatedType === 'tenant' && (
                    <Link
                      href={`/tenants/${task.relatedId}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {task.relatedEntity.firstName} {task.relatedEntity.lastName}
                    </Link>
                  )}
                  {task.relatedType === 'maintenance' && (
                    <Link
                      href={`/maintenance/${task.relatedId}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {task.relatedEntity.title}
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {task.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{task.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
