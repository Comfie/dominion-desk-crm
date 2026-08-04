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
};

type InquiryOption = {
  id: string;
  propertyId: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
};

type ApplicationOption = {
  id: string;
  propertyId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
};

type ViewingDefaults = {
  propertyId: string;
  inquiryId: string;
  rentalApplicationId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

interface NewViewingFormProps {
  properties: PropertyOption[];
  inquiries: InquiryOption[];
  applications: ApplicationOption[];
  defaults: ViewingDefaults;
}

export function NewViewingForm({
  properties,
  inquiries,
  applications,
  defaults,
}: NewViewingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [propertyId, setPropertyId] = useState(defaults.propertyId);
  const [inquiryId, setInquiryId] = useState(defaults.inquiryId);
  const [rentalApplicationId, setRentalApplicationId] = useState(defaults.rentalApplicationId);
  const [contactName, setContactName] = useState(defaults.contactName);
  const [contactEmail, setContactEmail] = useState(defaults.contactEmail);
  const [contactPhone, setContactPhone] = useState(defaults.contactPhone || '');
  const [scheduledFor, setScheduledFor] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [assignedTo, setAssignedTo] = useState('');

  const handleInquiryChange = (nextInquiryId: string) => {
    setInquiryId(nextInquiryId);
    if (nextInquiryId) {
      setRentalApplicationId('');
    }

    const inquiry = inquiries.find((item) => item.id === nextInquiryId);
    if (!inquiry) {
      return;
    }

    if (inquiry.propertyId) {
      setPropertyId(inquiry.propertyId);
    }
    setContactName(inquiry.contactName);
    setContactEmail(inquiry.contactEmail);
    setContactPhone(inquiry.contactPhone || '');
  };

  const handleApplicationChange = (nextApplicationId: string) => {
    setRentalApplicationId(nextApplicationId);
    if (nextApplicationId) {
      setInquiryId('');
    }

    const application = applications.find((item) => item.id === nextApplicationId);
    if (!application) {
      return;
    }

    setPropertyId(application.propertyId);
    setContactName(application.applicantName);
    setContactEmail(application.applicantEmail);
    setContactPhone(application.applicantPhone || '');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/placement/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          inquiryId: inquiryId || null,
          rentalApplicationId: rentalApplicationId || null,
          contactName,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : '',
          durationMinutes: Number(durationMinutes),
          assignedTo: assignedTo || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule viewing');
      }

      toast({
        title: 'Viewing scheduled',
        description: 'The viewing has been added to the placement schedule.',
      });
      router.push('/placement/viewings');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Could not schedule viewing',
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
        <CardTitle>Viewing Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property</Label>
              <select
                id="propertyId"
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
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
              <Label htmlFor="inquiryId">Inquiry</Label>
              <select
                id="inquiryId"
                value={inquiryId}
                onChange={(event) => handleInquiryChange(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">No inquiry</option>
                {inquiries.map((inquiry) => (
                  <option key={inquiry.id} value={inquiry.id}>
                    {inquiry.contactName} - {inquiry.contactEmail}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentalApplicationId">Application</Label>
              <select
                id="rentalApplicationId"
                value={rentalApplicationId}
                onChange={(event) => handleApplicationChange(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">No application</option>
                {applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.applicantName} - {application.applicantEmail}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned Agent</Label>
              <Input
                id="assignedTo"
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledFor">Viewing Date and Time</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration</Label>
              <Input
                id="durationMinutes"
                type="number"
                min="15"
                max="180"
                step="15"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/placement/viewings')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Schedule Viewing
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
