'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Building2,
  AlertTriangle,
  Check,
  Users,
  FileText,
  Loader2,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SubscribeModal } from '@/components/subscription/subscribe-modal';
import { useToast } from '@/hooks/use-toast';
import { getBillingBreakdownKey } from '@/lib/subscription-billing-key';

interface PropertyBillingItem {
  leaseId?: string;
  propertyId: string;
  propertyName: string;
  tenantName: string;
  monthlyRent: number;
  calculatedFee: number;
  actualFee: number;
  isFreeProperty: boolean;
}

interface SubscriptionCalculation {
  baseFee: number;
  totalPropertyFees: number;
  totalMonthlyFee: number;
  activePropertyCount: number;
  freePropertyCount: number;
  chargeablePropertyCount: number;
  breakdown: PropertyBillingItem[];
}

interface SubscriptionStatusData {
  isOnTrial: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  subscriptionEndsAt: string | null;
  nextBillingDate: string | null;
  subscriptionStatus: string;
  restrictionLevel: 'NONE' | 'WARNING' | 'LIMITED' | 'READONLY' | 'SUSPENDED';
  restrictionMessage: string | null;
  canAddProperties: boolean;
  canCreateBookings: boolean;
  canEditData: boolean;
  currentBilling: SubscriptionCalculation;
}

interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paidAt: string | null;
  createdAt: string;
}

interface BillingHistoryResponse {
  invoices: BillingInvoice[];
  total: number;
  page: number;
  totalPages: number;
}

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelConfirmation, setCancelConfirmation] = useState('');
  const { toast } = useToast();

  const { data, isLoading } = useQuery<SubscriptionStatusData>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/status');
      if (!response.ok) throw new Error('Failed to fetch subscription status');
      return response.json();
    },
  });

  const { data: billingHistory, isLoading: isLoadingHistory } = useQuery<BillingHistoryResponse>({
    queryKey: ['billing-history', 1],
    queryFn: async () => {
      const response = await fetch('/api/billing/history?page=1&limit=5');
      if (!response.ok) throw new Error('Failed to fetch billing history');
      return response.json();
    },
    enabled: data?.subscriptionStatus === 'ACTIVE' || data?.subscriptionStatus === 'CANCELLED',
  });

  const cancelSubscription = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }
      return response.json();
    },
    onSuccess: (result) => {
      const propertiesAboveFreeTierCount = result?.details?.propertiesAboveFreeTierCount ?? 0;

      toast({
        title: 'Subscription cancelled',
        description:
          propertiesAboveFreeTierCount > 0
            ? `Your paid plan remains active until the end date. After that, ${propertiesAboveFreeTierCount} properties will be above the free tier limit.`
            : 'Your paid plan remains active until the end date and will not renew.',
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      queryClient.invalidateQueries({ queryKey: ['billing-history', 1] });
      setShowCancelDialog(false);
      setCancellationReason('');
      setCancelConfirmation('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCancelSubscription = async () => {
    const reason = cancellationReason.trim();
    if (!reason || cancelConfirmation !== 'CANCEL') {
      return;
    }

    await cancelSubscription.mutateAsync(reason);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const status = data?.subscriptionStatus || 'TRIAL';
  const billing = data?.currentBilling;
  const subscriptionDateLabel =
    status === 'ACTIVE'
      ? 'Next billing date'
      : status === 'CANCELLED'
        ? 'Paid access expires'
        : data?.isOnTrial
          ? 'Trial ends'
          : 'Subscription expiry';
  const subscriptionDate =
    status === 'ACTIVE'
      ? data?.nextBillingDate || data?.subscriptionEndsAt
      : status === 'CANCELLED'
        ? data?.subscriptionEndsAt
        : data?.isOnTrial
          ? data?.trialEndsAt
          : data?.subscriptionEndsAt;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="Manage your subscription and view billing details"
      />

      {/* Restriction Warning */}
      {data?.restrictionMessage && (
        <Alert variant={data.restrictionLevel === 'WARNING' ? 'default' : 'destructive'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {data.restrictionLevel === 'WARNING' && 'Trial Expired'}
            {data.restrictionLevel === 'LIMITED' && 'Limited Access'}
            {data.restrictionLevel === 'READONLY' && 'Read-Only Mode'}
            {data.restrictionLevel === 'SUSPENDED' && 'Account Suspended'}
          </AlertTitle>
          <AlertDescription>{data.restrictionMessage}</AlertDescription>
        </Alert>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Status
          </CardTitle>
          <CardDescription>Your current plan and billing details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Row */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant={
                    status === 'ACTIVE'
                      ? 'default'
                      : status === 'TRIAL'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="text-sm"
                >
                  {status}
                </Badge>
                {data?.isOnTrial && data.trialDaysRemaining !== null && (
                  <span className="text-muted-foreground text-sm">
                    {data.trialDaysRemaining} days remaining in trial
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-background rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs font-medium">
                    {subscriptionDateLabel}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {subscriptionDate ? formatDate(subscriptionDate) : 'Not scheduled'}
                  </p>
                </div>
                {status === 'CANCELLED' && (
                  <div className="rounded-lg border bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="text-xs font-medium">Renewal status</p>
                    <p className="mt-1 text-sm font-semibold">Will not renew</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {status !== 'ACTIVE' && (
                <Button onClick={() => setShowSubscribeModal(true)}>Subscribe Now</Button>
              )}
              {status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelSubscription.isPending}
                >
                  {cancelSubscription.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Pricing Explanation */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="mb-2 font-medium">How Pricing Works</h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>
                  <strong>R299/month</strong> base subscription
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>
                  <strong>First 2 properties</strong> included free
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>
                  <strong>4% of monthly rent</strong> for each additional active property
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Per-property fees: min R99, max R999</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Current Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Current Billing Estimate
          </CardTitle>
          <CardDescription>
            Based on {billing?.activePropertyCount || 0} active properties with tenants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-muted-foreground text-sm">Base Fee</p>
              <p className="text-2xl font-bold">{formatCurrency(billing?.baseFee || 299)}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-muted-foreground text-sm">Property Fees</p>
              <p className="text-2xl font-bold">
                {formatCurrency(billing?.totalPropertyFees || 0)}
              </p>
              <p className="text-muted-foreground text-xs">
                {billing?.chargeablePropertyCount || 0} chargeable properties
              </p>
            </div>
            <div className="bg-primary/5 rounded-lg border p-4 text-center">
              <p className="text-muted-foreground text-sm">Total Monthly</p>
              <p className="text-primary text-2xl font-bold">
                {formatCurrency(billing?.totalMonthlyFee || 299)}
              </p>
            </div>
          </div>

          {/* Property Breakdown */}
          {billing?.breakdown && billing.breakdown.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <Users className="h-4 w-4" />
                Active Properties Breakdown
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Monthly Rent</TableHead>
                    <TableHead className="text-right">Fee (4%)</TableHead>
                    <TableHead className="text-right">Actual Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billing.breakdown.map((item, index) => (
                    <TableRow key={getBillingBreakdownKey(item, index)}>
                      <TableCell className="font-medium">
                        {item.propertyName}
                        {item.isFreeProperty && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Free
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.tenantName}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.monthlyRent)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right">
                        {item.isFreeProperty ? '-' : formatCurrency(item.calculatedFee)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.isFreeProperty ? (
                          <span className="text-green-600">R0.00</span>
                        ) : (
                          formatCurrency(item.actualFee)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* No active properties */}
          {(!billing?.breakdown || billing.breakdown.length === 0) && (
            <div className="text-muted-foreground py-8 text-center">
              <Building2 className="mx-auto mb-2 h-12 w-12 opacity-30" />
              <p>No active properties with tenants</p>
              <p className="text-sm">Add tenants to your properties to see billing estimates</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Billing History
              </CardTitle>
              <CardDescription>Your past invoices and payments</CardDescription>
            </div>
            {billingHistory && billingHistory.invoices.length > 0 && (
              <Button variant="outline" size="sm" asChild>
                <a href="/settings/billing">View All</a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : billingHistory && billingHistory.invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === 'PAID'
                            ? 'default'
                            : invoice.status === 'PENDING'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <FileText className="mx-auto mb-2 h-12 w-12 opacity-30" />
              <p>No billing history available</p>
              <p className="text-sm">Your invoices will appear here once you subscribe</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscribe Modal */}
      {billing && (
        <SubscribeModal
          open={showSubscribeModal}
          onOpenChange={setShowSubscribeModal}
          currentBilling={billing}
        />
      )}

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Review what happens next before cancelling your active subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cancellation details</AlertTitle>
              <AlertDescription>
                Your paid subscription will be cancelled and will not renew. You keep your current
                paid access until the subscription end date, then the account moves to the free
                tier.
              </AlertDescription>
            </Alert>

            <div className="grid gap-3 rounded-lg border p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Current status</span>
                <Badge variant="default">{status}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Estimated monthly billing</span>
                <span className="font-medium">
                  {formatCurrency(billing?.totalMonthlyFee || 299)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Active properties</span>
                <span className="font-medium">{billing?.activePropertyCount || 0}</span>
              </div>
              {data?.trialEndsAt && data.isOnTrial && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Trial ends</span>
                  <span className="font-medium">{formatDate(data.trialEndsAt)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationReason">Reason for cancelling</Label>
              <Textarea
                id="cancellationReason"
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                placeholder="Tell us why you are cancelling..."
                rows={4}
              />
              <p className="text-muted-foreground text-xs">
                This is required and helps the administrator understand the cancellation.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancelConfirmation">Type CANCEL to confirm</Label>
              <Input
                id="cancelConfirmation"
                value={cancelConfirmation}
                onChange={(event) => setCancelConfirmation(event.target.value)}
                placeholder="CANCEL"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelSubscription.isPending}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={
                cancelSubscription.isPending ||
                cancellationReason.trim().length === 0 ||
                cancelConfirmation !== 'CANCEL'
              }
            >
              {cancelSubscription.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
