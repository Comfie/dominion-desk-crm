'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, AlertCircle, ListChecks, X, Check } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TemplateSelector } from '@/components/tasks/template-selector';

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

interface ChecklistItem {
  item: string;
  isRequired: boolean;
  sortOrder: number;
}

interface TaskTemplate {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  taskType: string;
  priority: string;
  checklist: ChecklistItem[] | null;
  isSystem: boolean;
  category: string | null;
}

export default function NewTaskPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

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
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch tenants for linking
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await fetch('/api/tenants');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch bookings for linking
  const { data: bookingsData } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch maintenance requests for linking
  const { data: maintenanceData } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const response = await fetch('/api/maintenance');
      if (!response.ok) throw new Error('Failed to fetch maintenance requests');
      const result = await response.json();
      return result.data || [];
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      // Create the task
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
      const task = await response.json();

      // If there are checklist items, add them to the task
      if (checklistItems.length > 0) {
        const checklistResponse = await fetch(`/api/tasks/${task.id}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: checklistItems }),
        });
        if (!checklistResponse.ok) {
          console.error('Failed to create checklist items');
        }
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.push('/tasks');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Handle template selection
  const handleTemplateSelect = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setValue('title', template.name);
    if (template.description) {
      setValue('description', template.description);
    }
    setValue('taskType', template.taskType);
    setValue('priority', template.priority);

    // Set checklist items from template
    if (template.checklist && template.checklist.length > 0) {
      setChecklistItems(template.checklist);
    }
  };

  // Clear template
  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    setChecklistItems([]);
  };

  // Remove a checklist item
  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems((items) => items.filter((_, i) => i !== index));
  };

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
        {/* Template Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Quick Start with Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="bg-muted text-foreground flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    Using template: <span className="text-primary">{selectedTemplate.name}</span>
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {selectedTemplate.checklist?.length || 0} checklist items will be added
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearTemplate}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Select a template to auto-fill task details and checklist items
                </p>
                <TemplateSelector onSelect={handleTemplateSelect} selectedTemplateId={undefined} />
              </div>
            )}
          </CardContent>
        </Card>

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
                      {Array.isArray(propertiesData) &&
                        propertiesData.map((property: { id: string; name: string }) => (
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
                      {Array.isArray(bookingsData) &&
                        bookingsData.map(
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
                      {Array.isArray(tenantsData) &&
                        tenantsData.map(
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
                      {Array.isArray(maintenanceData) &&
                        maintenanceData.map((request: { id: string; title: string }) => (
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

        {/* Checklist Preview */}
        {checklistItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Checklist Items
                <Badge variant="secondary" className="ml-auto">
                  {checklistItems.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                These checklist items will be added to the task when created.
              </p>
              <ul className="space-y-2">
                {checklistItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{item.isRequired ? '●' : '○'}</span>
                      <span className={item.isRequired ? 'font-medium' : ''}>{item.item}</span>
                      {item.isRequired && (
                        <Badge variant="outline" className="text-orange-600">
                          Required
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveChecklistItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

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
