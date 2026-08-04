'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, FileText, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type ScreeningStatus = 'NOT_STARTED' | 'PENDING' | 'PASSED' | 'FAILED' | 'NEEDS_REVIEW';

type ReferenceCheckStatus = 'NOT_REQUESTED' | 'REQUESTED' | 'RECEIVED' | 'PASSED' | 'FAILED';

type ScreeningValues = {
  creditCheckStatus: ScreeningStatus;
  affordabilityStatus: ScreeningStatus;
  employerReferenceStatus: ReferenceCheckStatus;
  landlordReferenceStatus: ReferenceCheckStatus;
  ficaStatus: ScreeningStatus;
  declaredMonthlyIncome: string;
  riskScore: string;
  consentReceived: boolean;
  notes: string;
};

interface ScreeningChecklistProps {
  applicationId: string;
  applicantName: string;
  proposedMonthlyRent: number | null;
  documentsHref: string;
  screening: ScreeningValues;
}

const screeningOptions: Array<{ value: ScreeningStatus; label: string }> = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'NEEDS_REVIEW', label: 'Needs Review' },
];

const referenceOptions: Array<{
  value: ReferenceCheckStatus;
  label: string;
}> = [
  { value: 'NOT_REQUESTED', label: 'Not Requested' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
];

function ScreeningSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ScreeningChecklist({
  applicationId,
  applicantName,
  proposedMonthlyRent,
  documentsHref,
  screening,
}: ScreeningChecklistProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState(screening);

  const updateValue = <Key extends keyof ScreeningValues>(
    key: Key,
    value: ScreeningValues[Key]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/placement/applications/${applicationId}/screening`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditCheckStatus: values.creditCheckStatus,
          affordabilityStatus: values.affordabilityStatus,
          employerReferenceStatus: values.employerReferenceStatus,
          landlordReferenceStatus: values.landlordReferenceStatus,
          ficaStatus: values.ficaStatus,
          declaredMonthlyIncome: values.declaredMonthlyIncome
            ? Number(values.declaredMonthlyIncome)
            : null,
          riskScore: values.riskScore ? Number(values.riskScore) : null,
          consentReceived: values.consentReceived,
          notes: values.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update screening');
      }

      toast({
        title: 'Screening updated',
        description: `The checklist for ${applicantName} has been saved.`,
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Could not update screening',
        description:
          error instanceof Error ? error.message : 'Please check the checklist and try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardCheck className="mr-2 h-4 w-4" />
          Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Applicant Screening</DialogTitle>
          <DialogDescription>
            {applicantName}
            {proposedMonthlyRent !== null
              ? ` - proposed rent R${proposedMonthlyRent.toLocaleString('en-ZA')}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex justify-end">
            <Button asChild size="sm" variant="outline">
              <Link href={documentsHref}>
                <FileText className="mr-2 h-4 w-4" />
                Review Documents
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ScreeningSelect
              id={`${applicationId}-credit`}
              label="Credit Check"
              value={values.creditCheckStatus}
              options={screeningOptions}
              onChange={(value) => updateValue('creditCheckStatus', value as ScreeningStatus)}
            />
            <ScreeningSelect
              id={`${applicationId}-affordability`}
              label="Affordability"
              value={values.affordabilityStatus}
              options={screeningOptions}
              onChange={(value) => updateValue('affordabilityStatus', value as ScreeningStatus)}
            />
            <ScreeningSelect
              id={`${applicationId}-employer-reference`}
              label="Employer Reference"
              value={values.employerReferenceStatus}
              options={referenceOptions}
              onChange={(value) =>
                updateValue('employerReferenceStatus', value as ReferenceCheckStatus)
              }
            />
            <ScreeningSelect
              id={`${applicationId}-landlord-reference`}
              label="Landlord Reference"
              value={values.landlordReferenceStatus}
              options={referenceOptions}
              onChange={(value) =>
                updateValue('landlordReferenceStatus', value as ReferenceCheckStatus)
              }
            />
            <ScreeningSelect
              id={`${applicationId}-fica`}
              label="FICA"
              value={values.ficaStatus}
              options={screeningOptions}
              onChange={(value) => updateValue('ficaStatus', value as ScreeningStatus)}
            />
            <div className="space-y-2">
              <Label htmlFor={`${applicationId}-income`}>Declared Monthly Income</Label>
              <Input
                id={`${applicationId}-income`}
                type="number"
                min="0"
                step="0.01"
                value={values.declaredMonthlyIncome}
                onChange={(event) => updateValue('declaredMonthlyIncome', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${applicationId}-risk`}>Risk Score (0-100)</Label>
              <Input
                id={`${applicationId}-risk`}
                type="number"
                min="0"
                max="100"
                value={values.riskScore}
                onChange={(event) => updateValue('riskScore', event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 pt-8 text-sm">
              <input
                type="checkbox"
                checked={values.consentReceived}
                onChange={(event) => updateValue('consentReceived', event.target.checked)}
              />
              POPIA and screening consent received
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${applicationId}-notes`}>Screening Notes</Label>
            <Textarea
              id={`${applicationId}-notes`}
              value={values.notes}
              onChange={(event) => updateValue('notes', event.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="mr-2 h-4 w-4" />
              )}
              Save Screening
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
