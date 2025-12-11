'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const maintenanceSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  tenantId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.string(),
  location: z.string().optional(),
  scheduledDate: z.string().optional(),
  estimatedCost: z.number().optional(),
  assignedTo: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

async function fetchProperties() {
  const response = await fetch('/api/properties');
  if (!response.ok) throw new Error('Failed to fetch properties');
  const result = await response.json();
  return result.data || [];
}

async function fetchTenants() {
  const response = await fetch('/api/tenants');
  if (!response.ok) throw new Error('Failed to fetch tenants');
  const result = await response.json();
  return result.data || [];
}

export default function NewMaintenancePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      priority: 'NORMAL',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create maintenance request');
      }
      return response.json();
    },
    onSuccess: () => {
      router.push('/maintenance');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: MaintenanceFormData) => {
    setError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Maintenance Request"
        description="Create a maintenance or repair request"
      >
        <Button variant="outline" asChild>
          <Link href="/maintenance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">{error}</div>
        )}

        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Describe the maintenance issue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Leaking faucet in bathroom"
                {...register('title')}
              />
              {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe the issue in detail..."
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('category')}
                >
                  <option value="">Select category</option>
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
                {errors.category && (
                  <p className="text-destructive text-sm">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('priority')}
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location in Property</Label>
              <Input
                id="location"
                placeholder="e.g., Master bathroom, Kitchen"
                {...register('location')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Property and Tenant */}
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
            <CardDescription>Select the property for this request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property *</Label>
              <select
                id="propertyId"
                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                {...register('propertyId')}
              >
                <option value="">Select property</option>
                {properties?.map((property: { id: string; name: string; address: string }) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
              {errors.propertyId && (
                <p className="text-destructive text-sm">{errors.propertyId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Reported By (Tenant)</Label>
              <select
                id="tenantId"
                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                {...register('tenantId')}
              >
                <option value="">Select tenant (optional)</option>
                {tenants?.map((tenant: { id: string; firstName: string; lastName: string }) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.firstName} {tenant.lastName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling and Cost */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduling & Costs</CardTitle>
            <CardDescription>Schedule the work and estimate costs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input id="scheduledDate" type="date" {...register('scheduledDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost (R)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('estimatedCost')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To (Contractor/Service Provider)</Label>
              <Input
                id="assignedTo"
                placeholder="e.g., John's Plumbing Services"
                {...register('assignedTo')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/maintenance">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Request'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
