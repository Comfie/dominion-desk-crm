'use client';

import { useMemo, useState } from 'react';
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
  monthlyRent: number | null;
  securityDeposit: number | null;
};

type InquiryOption = {
  id: string;
  propertyId: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
};

type FormDefaults = {
  propertyId: string;
  inquiryId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
};

interface NewRentalApplicationFormProps {
  properties: PropertyOption[];
  inquiries: InquiryOption[];
  defaults: FormDefaults;
}

function splitApplicantName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

export function NewRentalApplicationForm({
  properties,
  inquiries,
  defaults,
}: NewRentalApplicationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const defaultName = splitApplicantName(defaults.applicantName);
  const [submitting, setSubmitting] = useState(false);
  const [propertyId, setPropertyId] = useState(defaults.propertyId);
  const [inquiryId, setInquiryId] = useState(defaults.inquiryId);
  const [firstName, setFirstName] = useState(defaultName.firstName);
  const [lastName, setLastName] = useState(defaultName.lastName);
  const [email, setEmail] = useState(defaults.applicantEmail);
  const [phone, setPhone] = useState(defaults.applicantPhone || '');
  const [idNumber, setIdNumber] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === propertyId),
    [properties, propertyId]
  );

  const handleInquiryChange = (nextInquiryId: string) => {
    setInquiryId(nextInquiryId);
    const inquiry = inquiries.find((item) => item.id === nextInquiryId);

    if (!inquiry) {
      return;
    }

    const inquiryName = splitApplicantName(inquiry.contactName);
    setFirstName(inquiryName.firstName);
    setLastName(inquiryName.lastName);
    setEmail(inquiry.contactEmail);
    setPhone(inquiry.contactPhone || '');

    if (inquiry.propertyId) {
      setPropertyId(inquiry.propertyId);
    }
  };

  const applyPropertyDefaults = () => {
    if (!selectedProperty) {
      return;
    }

    if (selectedProperty.monthlyRent !== null) {
      setMonthlyRent(String(selectedProperty.monthlyRent));
    }

    if (selectedProperty.securityDeposit !== null) {
      setDeposit(String(selectedProperty.securityDeposit));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/placement/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          inquiryId: inquiryId || null,
          applicantFirstName: firstName,
          applicantLastName: lastName,
          applicantEmail: email,
          applicantPhone: phone || null,
          idNumber: idNumber || null,
          requestedMoveInDate: moveInDate || null,
          proposedLeaseStartDate: leaseStartDate || null,
          proposedLeaseEndDate: leaseEndDate || null,
          proposedMonthlyRent: monthlyRent ? Number(monthlyRent) : undefined,
          proposedDeposit: deposit ? Number(deposit) : undefined,
          assignedTo: assignedTo || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create application');
      }

      toast({
        title: 'Application created',
        description: 'The applicant is now in the placement pipeline.',
      });
      router.push('/placement/applications');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Could not create application',
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
        <CardTitle>Application Details</CardTitle>
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
              <Label htmlFor="inquiryId">Linked Inquiry</Label>
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
          </div>

          {selectedProperty && (
            <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
              <p className="text-muted-foreground text-sm">
                Selected property: <span className="text-foreground">{selectedProperty.name}</span>
              </p>
              <Button type="button" variant="outline" size="sm" onClick={applyPropertyDefaults}>
                Use Property Pricing
              </Button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID / Passport</Label>
              <Input
                id="idNumber"
                value={idNumber}
                onChange={(event) => setIdNumber(event.target.value)}
              />
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="moveInDate">Requested Move-in</Label>
              <Input
                id="moveInDate"
                type="date"
                value={moveInDate}
                onChange={(event) => setMoveInDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseStartDate">Lease Start</Label>
              <Input
                id="leaseStartDate"
                type="date"
                value={leaseStartDate}
                onChange={(event) => setLeaseStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseEndDate">Lease End</Label>
              <Input
                id="leaseEndDate"
                type="date"
                value={leaseEndDate}
                onChange={(event) => setLeaseEndDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Proposed Rent</Label>
              <Input
                id="monthlyRent"
                type="number"
                min="0"
                step="0.01"
                value={monthlyRent}
                onChange={(event) => setMonthlyRent(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Proposed Deposit</Label>
              <Input
                id="deposit"
                type="number"
                min="0"
                step="0.01"
                value={deposit}
                onChange={(event) => setDeposit(event.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/placement/applications')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Application
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
