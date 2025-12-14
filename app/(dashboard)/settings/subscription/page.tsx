'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, Building2, AlertTriangle, Check, Users } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PropertyBillingItem {
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
  subscriptionStatus: string;
  restrictionLevel: 'NONE' | 'WARNING' | 'LIMITED' | 'READONLY' | 'SUSPENDED';
  restrictionMessage: string | null;
  canAddProperties: boolean;
  canCreateBookings: boolean;
  canEditData: boolean;
  currentBilling: SubscriptionCalculation;
}

export default function SubscriptionPage() {
  const { data, isLoading } = useQuery<SubscriptionStatusData>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/status');
      if (!response.ok) throw new Error('Failed to fetch subscription status');
      return response.json();
    },
  });

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  status === 'ACTIVE' ? 'default' : status === 'TRIAL' ? 'secondary' : 'destructive'
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
              {data?.trialEndsAt && data.isOnTrial && (
                <span className="text-muted-foreground text-xs">
                  (ends {formatDate(data.trialEndsAt)})
                </span>
              )}
            </div>
            <Button>Subscribe Now</Button>
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
                    <TableRow key={item.propertyId}>
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
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            <p>No billing history available</p>
            <p className="text-sm">Your invoices will appear here once you subscribe</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
