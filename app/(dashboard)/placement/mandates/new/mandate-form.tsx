'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type PropertyOption = {
  id: string;
  name: string;
  city: string;
  landlordOwnerId: string | null;
};

type LandlordOption = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  displayName: string;
};

type MandateDefaults = {
  propertyId: string;
  landlordOwnerId: string;
};

type MandateFormValues = {
  id?: string;
  propertyId: string;
  landlordOwnerId: string;
  mandateType: string;
  exclusivity: string;
  status: string;
  startDate: string;
  endDate: string;
  placementFeePercentage: string;
  managementFeePercentage: string;
  vatApplicable: boolean;
  mandateDocumentUrl: string;
  notes: string;
};

interface NewMandateFormProps {
  properties: PropertyOption[];
  landlords: LandlordOption[];
  defaults: MandateDefaults;
  mode?: 'create' | 'edit';
  initialValues?: MandateFormValues;
}

export function NewMandateForm({
  properties,
  landlords,
  defaults,
  mode = 'create',
  initialValues,
}: NewMandateFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formValues = initialValues || {
    propertyId: defaults.propertyId,
    landlordOwnerId: defaults.landlordOwnerId,
    mandateType: 'PLACEMENT_ONLY',
    exclusivity: 'OPEN',
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
    placementFeePercentage: '',
    managementFeePercentage: '',
    vatApplicable: true,
    mandateDocumentUrl: '',
    notes: '',
  };
  const [submitting, setSubmitting] = useState(false);
  const [propertyId, setPropertyId] = useState(formValues.propertyId);
  const [landlordOwnerId, setLandlordOwnerId] = useState(formValues.landlordOwnerId);
  const [mandateType, setMandateType] = useState(formValues.mandateType);
  const [exclusivity, setExclusivity] = useState(formValues.exclusivity);
  const [status, setStatus] = useState(formValues.status);
  const [startDate, setStartDate] = useState(formValues.startDate);
  const [endDate, setEndDate] = useState(formValues.endDate);
  const [placementFeePercentage, setPlacementFeePercentage] = useState(
    formValues.placementFeePercentage
  );
  const [managementFeePercentage, setManagementFeePercentage] = useState(
    formValues.managementFeePercentage
  );
  const [vatApplicable, setVatApplicable] = useState(formValues.vatApplicable);
  const [mandateDocumentUrl, setMandateDocumentUrl] = useState(formValues.mandateDocumentUrl);
  const [notes, setNotes] = useState(formValues.notes);
  const isEdit = mode === 'edit';

  const handlePropertyChange = (nextPropertyId: string) => {
    setPropertyId(nextPropertyId);
    const property = properties.find((item) => item.id === nextPropertyId);

    if (property?.landlordOwnerId) {
      setLandlordOwnerId(property.landlordOwnerId);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        isEdit ? `/api/placement/mandates/${formValues.id}` : '/api/placement/mandates',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId,
            landlordOwnerId: landlordOwnerId || null,
            mandateType,
            exclusivity,
            status,
            startDate,
            endDate: endDate || null,
            placementFeePercentage: placementFeePercentage ? Number(placementFeePercentage) : null,
            managementFeePercentage: managementFeePercentage
              ? Number(managementFeePercentage)
              : null,
            vatApplicable,
            mandateDocumentUrl: mandateDocumentUrl || null,
            notes: notes || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEdit ? 'update' : 'create'} mandate`);
      }

      toast({
        title: isEdit ? 'Mandate updated' : 'Mandate created',
        description: isEdit
          ? 'The agreement has been updated.'
          : 'The agreement has been added to the mandate register.',
      });
      router.push('/placement/mandates');
      router.refresh();
    } catch (error) {
      toast({
        title: isEdit ? 'Could not update mandate' : 'Could not create mandate',
        description:
          error instanceof Error ? error.message : 'Please check the form and try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mandate Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property</Label>
              <select
                id="propertyId"
                value={propertyId}
                onChange={(event) => handlePropertyChange(event.target.value)}
                required
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">Select property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="landlordOwnerId">Landlord</Label>
              <select
                id="landlordOwnerId"
                value={landlordOwnerId}
                onChange={(event) => setLandlordOwnerId(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">No landlord linked</option>
                {landlords.map((landlord) => (
                  <option key={landlord.id} value={landlord.id}>
                    {landlord.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mandateType">Mandate Type</Label>
              <select
                id="mandateType"
                value={mandateType}
                onChange={(event) => setMandateType(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="PLACEMENT_ONLY">Placement Only</option>
                <option value="MANAGED_RENTAL">Managed Rental</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exclusivity">Exclusivity</Label>
              <select
                id="exclusivity"
                value={exclusivity}
                onChange={(event) => setExclusivity(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="OPEN">Open</option>
                <option value="SOLE">Sole</option>
                <option value="DUAL">Dual</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="placementFeePercentage">Placement Fee %</Label>
              <Input
                id="placementFeePercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={placementFeePercentage}
                onChange={(event) => setPlacementFeePercentage(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="managementFeePercentage">Management Fee %</Label>
              <Input
                id="managementFeePercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={managementFeePercentage}
                onChange={(event) => setManagementFeePercentage(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 pt-8 text-sm">
              <input
                type="checkbox"
                checked={vatApplicable}
                onChange={(event) => setVatApplicable(event.target.checked)}
              />
              VAT applicable
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mandateDocumentUrl">Mandate Document URL</Label>
            <Input
              id="mandateDocumentUrl"
              type="url"
              value={mandateDocumentUrl}
              onChange={(event) => setMandateDocumentUrl(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/placement/mandates')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Update Mandate' : 'Create Mandate'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
