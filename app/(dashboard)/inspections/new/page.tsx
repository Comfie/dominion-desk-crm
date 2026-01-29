'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
}

export default function NewInspectionPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [inspectionType, setInspectionType] = useState('ROUTINE');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [inspector, setInspector] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch properties
  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await fetch('/api/properties');
      if (!res.ok) throw new Error('Failed to fetch properties');
      return res.json();
    },
  });

  // Fetch tenants
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await fetch('/api/tenants');
      if (!res.ok) throw new Error('Failed to fetch tenants');
      return res.json();
    },
  });

  const properties = propertiesData?.data || [];
  const tenants = tenantsData?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: {
      propertyId: string;
      tenantId?: string;
      inspectionType: string;
      scheduledDate: string;
      inspector?: string;
      overallNotes?: string;
    }) => {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create inspection');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Inspection created',
        description: 'The inspection has been scheduled successfully.',
      });
      router.push(`/inspections/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!propertyId) {
      toast({ title: 'Error', description: 'Please select a property', variant: 'destructive' });
      return;
    }

    if (!scheduledDate) {
      toast({
        title: 'Error',
        description: 'Please select a scheduled date',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      propertyId,
      tenantId: tenantId || undefined,
      inspectionType,
      scheduledDate: new Date(scheduledDate).toISOString(),
      inspector: inspector || undefined,
      overallNotes: notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Inspection" description="Schedule a property inspection">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Inspection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="property">Property *</Label>
                <select
                  id="property"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((property: Property) => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.address}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant (optional)</Label>
                <select
                  id="tenant"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="">No tenant</option>
                  {tenants.map((tenant: Tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.firstName} {tenant.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Inspection Type *</Label>
                <select
                  id="type"
                  value={inspectionType}
                  onChange={(e) => setInspectionType(e.target.value)}
                  className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                  required
                >
                  <option value="MOVE_IN">Move In</option>
                  <option value="MOVE_OUT">Move Out</option>
                  <option value="ROUTINE">Routine</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="ANNUAL">Annual</option>
                  <option value="PRE_PURCHASE">Pre-Purchase</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="inspector">Inspector Name</Label>
                <Input
                  id="inspector"
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder="Name of the inspector"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any initial notes for the inspection..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Schedule Inspection'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
