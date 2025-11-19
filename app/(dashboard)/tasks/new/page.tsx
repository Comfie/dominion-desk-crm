'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function NewTaskPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'NORMAL',
      status: 'TODO',
      taskType: '',
    },
  });

  const relatedType = watch('relatedType');

  // Fetch properties for linking
  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  // Fetch tenants for linking
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await fetch('/api/tenants');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json();
    },
  });

  // Fetch bookings for linking
  const { data: bookingsData } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
  });

  // Fetch maintenance requests for linking
  const { data: maintenanceData } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const response = await fetch('/api/maintenance');
      if (!response.ok) throw new Error('Failed to fetch maintenance requests');
      return response.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
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
        throw new Error(error.error || 'Failed to create task');
      }
      return response.json();
    },
    onSuccess: () => {
      router.push('/tasks');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: TaskFormData) => {
    setError(null);
    createTaskMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Task" description="Create a new task or reminder">
        <Link href="/tasks">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
      </PageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" {...register('title')} placeholder="Enter task title" />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskType">Task Type *</Label>
                <Select onValueChange={(value) => setValue('taskType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
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
                {errors.taskType && (
                  <p className="text-sm text-red-500">{errors.taskType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  defaultValue="NORMAL"
                  onValueChange={(value) => setValue('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
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
                <Select defaultValue="TODO" onValueChange={(value) => setValue('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
                <Input
                  id="assignedTo"
                  {...register('assignedTo')}
                  placeholder="Enter assignee name"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Enter task description"
                  rows={3}
                />
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
                <Label htmlFor="relatedType">Related To</Label>
                <Select
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
                  <Label htmlFor="relatedId">Property</Label>
                  <Select onValueChange={(value) => setValue('relatedId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertiesData?.properties?.map((property: { id: string; name: string }) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {relatedType === 'booking' && (
                <div className="space-y-2">
                  <Label htmlFor="relatedId">Booking</Label>
                  <Select onValueChange={(value) => setValue('relatedId', value)}>
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
                            {booking.guestName} - {booking.property?.name || 'Unknown Property'}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {relatedType === 'tenant' && (
                <div className="space-y-2">
                  <Label htmlFor="relatedId">Tenant</Label>
                  <Select onValueChange={(value) => setValue('relatedId', value)}>
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
                  <Label htmlFor="relatedId">Maintenance Request</Label>
                  <Select onValueChange={(value) => setValue('relatedId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select maintenance request" />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenanceData?.requests?.map((request: { id: string; title: string }) => (
                        <SelectItem key={request.id} value={request.id}>
                          {request.title}
                        </SelectItem>
                      ))}
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
            <Textarea {...register('notes')} placeholder="Add any additional notes..." rows={4} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/tasks">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={createTaskMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </div>
  );
}
