'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type LandlordFormValues = {
  id?: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  idNumber: string;
  taxNumber: string;
  vatNumber: string;
  vatRegistered: boolean;
  status: string;
  notes: string;
};

interface LandlordFormProps {
  mode?: 'create' | 'edit';
  initialValues?: LandlordFormValues;
}

const emptyLandlordValues: LandlordFormValues = {
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  phone: '',
  alternatePhone: '',
  idNumber: '',
  taxNumber: '',
  vatNumber: '',
  vatRegistered: false,
  status: 'ACTIVE',
  notes: '',
};

export function NewLandlordForm({
  mode = 'create',
  initialValues = emptyLandlordValues,
}: LandlordFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [lastName, setLastName] = useState(initialValues.lastName);
  const [companyName, setCompanyName] = useState(initialValues.companyName);
  const [email, setEmail] = useState(initialValues.email);
  const [phone, setPhone] = useState(initialValues.phone);
  const [alternatePhone, setAlternatePhone] = useState(initialValues.alternatePhone);
  const [idNumber, setIdNumber] = useState(initialValues.idNumber);
  const [taxNumber, setTaxNumber] = useState(initialValues.taxNumber);
  const [vatNumber, setVatNumber] = useState(initialValues.vatNumber);
  const [vatRegistered, setVatRegistered] = useState(initialValues.vatRegistered);
  const [status, setStatus] = useState(initialValues.status);
  const [notes, setNotes] = useState(initialValues.notes);
  const isEdit = mode === 'edit';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        isEdit ? `/api/placement/landlords/${initialValues.id}` : '/api/placement/landlords',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            companyName: companyName || null,
            email,
            phone: phone || null,
            alternatePhone: alternatePhone || null,
            idNumber: idNumber || null,
            taxNumber: taxNumber || null,
            vatNumber: vatNumber || null,
            vatRegistered,
            status,
            notes: notes || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEdit ? 'update' : 'create'} landlord`);
      }

      toast({
        title: isEdit ? 'Landlord updated' : 'Landlord created',
        description: isEdit
          ? 'The owner record has been updated.'
          : 'The owner has been added to the agency register.',
      });
      router.push('/placement/landlords');
      router.refresh();
    } catch (error) {
      toast({
        title: isEdit ? 'Could not update landlord' : 'Could not create landlord',
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
        <CardTitle>Owner Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
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
              <Label htmlFor="companyName">Company / Trust</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
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
              <Label htmlFor="alternatePhone">Alternate Phone</Label>
              <Input
                id="alternatePhone"
                value={alternatePhone}
                onChange={(event) => setAlternatePhone(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID / Registration Number</Label>
              <Input
                id="idNumber"
                value={idNumber}
                onChange={(event) => setIdNumber(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxNumber">Tax Number</Label>
              <Input
                id="taxNumber"
                value={taxNumber}
                onChange={(event) => setTaxNumber(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                value={vatNumber}
                onChange={(event) => setVatNumber(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 pt-8 text-sm">
              <input
                type="checkbox"
                checked={vatRegistered}
                onChange={(event) => setVatRegistered(event.target.checked)}
              />
              VAT registered
            </label>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
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
              onClick={() => router.push('/placement/landlords')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Update Landlord' : 'Create Landlord'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
