'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  messageType: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP']),
  category: z.string().optional(),
  isActive: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

async function fetchTemplate(id: string) {
  const response = await fetch(`/api/templates/${id}`);
  if (!response.ok) throw new Error('Failed to fetch template');
  return response.json();
}

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['template', id],
    queryFn: () => fetchTemplate(id),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      messageType: 'EMAIL',
      isActive: true,
    },
  });

  // Set form values when template data is loaded
  if (template && !watch('name')) {
    reset({
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      body: template.body,
      messageType: template.messageType,
      category: template.category || '',
      isActive: template.isActive,
    });
  }

  const messageType = watch('messageType');
  const isActive = watch('isActive');

  const updateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update template');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      router.push('/messages/templates');
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Template Not Found"
          description="The template you're looking for doesn't exist"
        >
          <Link href="/messages/templates">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Button>
          </Link>
        </PageHeader>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Template" description={`Editing: ${template.name}`}>
        <Link href="/messages/templates">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>Update your message template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input id="name" placeholder="e.g., Welcome Email" {...register('name')} />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messageType">Message Type</Label>
                    <Select
                      value={messageType}
                      onValueChange={(value) =>
                        setValue('messageType', value as 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="IN_APP">In-App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of when to use this template"
                    {...register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Select
                    value={watch('category') || ''}
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Email subject line" {...register('subject')} />
                  {errors.subject && (
                    <p className="text-sm text-red-500">{errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message Body</Label>
                  <Textarea
                    id="body"
                    placeholder="Type your message template here..."
                    rows={12}
                    {...register('body')}
                  />
                  {errors.body && <p className="text-sm text-red-500">{errors.body.message}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Variables</CardTitle>
                <CardDescription>Use variables to personalize your messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">How to use variables</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Wrap variable names in double curly braces. Variables will be automatically
                    detected.
                  </p>
                </div>

                {template.variables && template.variables.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Detected Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable: string) => (
                        <code key={variable} className="bg-muted rounded px-2 py-1 text-xs">
                          {`{{${variable}}}`}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Common Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      'guestName',
                      'propertyName',
                      'checkIn',
                      'checkOut',
                      'amount',
                      'dueDate',
                      'address',
                    ].map((variable) => (
                      <code key={variable} className="bg-muted rounded px-2 py-1 text-xs">
                        {`{{${variable}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-muted-foreground text-xs">Template is available for use</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setValue('isActive', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>

            {updateMutation.isError && (
              <p className="text-sm text-red-500">
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : 'Failed to update template'}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
