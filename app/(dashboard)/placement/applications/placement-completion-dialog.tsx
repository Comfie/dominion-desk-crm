'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, KeyRound, Loader2, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';

type CompletionResult = {
  application: {
    id: string;
    status: 'PLACED';
    tenantId: string;
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tenantResolution: 'LINKED' | 'EMAIL_MATCH' | 'CREATED';
  portalAccessActive: boolean;
  nextAction: 'ACTIVATE_PORTAL' | null;
};

interface PlacementCompletionDialogProps {
  applicationId: string;
  applicantName: string;
  eligible: boolean;
  allowsMultipleTenants: boolean;
  initialValues: {
    leaseStartDate: string;
    leaseEndDate: string;
    monthlyRent: string;
    depositPaid: string;
    moveInDate: string;
  };
  placedTenant: {
    id: string;
    portalAccessActive: boolean;
  } | null;
}

export function PlacementCompletionDialog({
  applicationId,
  applicantName,
  eligible,
  allowsMultipleTenants,
  initialValues,
  placedTenant,
}: PlacementCompletionDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activatingPortal, setActivatingPortal] = useState(false);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [leaseStartDate, setLeaseStartDate] = useState(initialValues.leaseStartDate);
  const [leaseEndDate, setLeaseEndDate] = useState(initialValues.leaseEndDate);
  const [monthlyRent, setMonthlyRent] = useState(initialValues.monthlyRent);
  const [depositPaid, setDepositPaid] = useState(initialValues.depositPaid);
  const [moveInDate, setMoveInDate] = useState(initialValues.moveInDate);
  const [unitLabel, setUnitLabel] = useState('');

  const activatePortal = async (tenantId: string) => {
    setActivatingPortal(true);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/portal-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate tenant portal');
      }

      setResult((current) =>
        current
          ? {
              ...current,
              portalAccessActive: true,
              nextAction: null,
            }
          : current
      );
      toast({
        title: 'Tenant portal activated',
        description: 'Portal credentials and the welcome email have been sent.',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Placement completed, portal still pending',
        description:
          error instanceof Error
            ? error.message
            : 'Retry portal activation from the tenant profile.',
        variant: 'destructive',
      });
    } finally {
      setActivatingPortal(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/placement/applications/${applicationId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseStartDate,
          leaseEndDate: leaseEndDate || null,
          monthlyRent: Number(monthlyRent),
          depositPaid: Number(depositPaid || 0),
          moveInDate: moveInDate || null,
          unitLabel: unitLabel.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete placement');
      }

      const completion = (await response.json()) as CompletionResult;
      setResult(completion);
      toast({
        title: 'Placement completed',
        description: `${applicantName} is now linked to the property lease.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Could not complete placement',
        description:
          error instanceof Error ? error.message : 'Check the lease details and try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (placedTenant && !eligible) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {placedTenant.portalAccessActive ? 'Portal active' : 'Portal pending'}
        </Badge>
        <Button asChild size="sm" variant="outline">
          <Link href={`/tenants/${placedTenant.id}`}>
            <UserRound className="mr-2 h-4 w-4" />
            View tenant
          </Link>
        </Button>
        {!placedTenant.portalAccessActive && (
          <Button
            size="sm"
            onClick={() => activatePortal(placedTenant.id)}
            disabled={activatingPortal}
          >
            {activatingPortal ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            Activate portal
          </Button>
        )}
      </div>
    );
  }

  if (!eligible) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Complete placement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Placement completed</DialogTitle>
              <DialogDescription>
                {result.tenant.firstName} {result.tenant.lastName} is linked to the lease. Tenant
                portal activation is the remaining onboarding action.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {result.portalAccessActive ? 'Portal active' : 'Portal pending'}
              </Badge>
              <span className="text-muted-foreground text-sm">{result.tenant.email}</span>
            </div>

            <DialogFooter>
              <Button asChild variant="outline">
                <Link href={`/tenants/${result.tenant.id}`}>
                  <UserRound className="mr-2 h-4 w-4" />
                  View tenant
                </Link>
              </Button>
              {!result.portalAccessActive && (
                <Button
                  onClick={() => activatePortal(result.tenant.id)}
                  disabled={activatingPortal}
                >
                  {activatingPortal ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  Activate tenant portal
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Complete placement</DialogTitle>
              <DialogDescription>
                Confirm the lease details for {applicantName}. Portal access will be activated
                separately after placement succeeds.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${applicationId}-lease-start`}>Lease Start</Label>
                  <Input
                    id={`${applicationId}-lease-start`}
                    type="date"
                    required
                    value={leaseStartDate}
                    onChange={(event) => setLeaseStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${applicationId}-lease-end`}>Lease End</Label>
                  <Input
                    id={`${applicationId}-lease-end`}
                    type="date"
                    value={leaseEndDate}
                    onChange={(event) => setLeaseEndDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${applicationId}-monthly-rent`}>Monthly Rent</Label>
                  <Input
                    id={`${applicationId}-monthly-rent`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={monthlyRent}
                    onChange={(event) => setMonthlyRent(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${applicationId}-deposit`}>Deposit Paid</Label>
                  <Input
                    id={`${applicationId}-deposit`}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={depositPaid}
                    onChange={(event) => setDepositPaid(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${applicationId}-move-in`}>Move-in Date</Label>
                  <Input
                    id={`${applicationId}-move-in`}
                    type="date"
                    value={moveInDate}
                    onChange={(event) => setMoveInDate(event.target.value)}
                  />
                </div>
                {allowsMultipleTenants && (
                  <div className="space-y-2">
                    <Label htmlFor={`${applicationId}-unit`}>Unit Label</Label>
                    <Input
                      id={`${applicationId}-unit`}
                      placeholder="Room A or Unit 2"
                      value={unitLabel}
                      onChange={(event) => setUnitLabel(event.target.value)}
                    />
                  </div>
                )}
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
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Confirm placement
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
