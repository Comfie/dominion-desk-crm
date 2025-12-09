'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, Check, ArrowRight, Building2 } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';

interface SubscriptionData {
  user: {
    subscriptionTier: string;
    subscriptionStatus: string;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    propertyLimit: number;
  };
  usage: {
    properties: number;
    propertyLimit: number;
  };
}

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    properties: 1,
    features: ['1 property', 'Basic booking management', 'Email support', 'Standard reports'],
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 199,
    properties: 5,
    popular: false,
    features: [
      'Up to 5 properties',
      'Full booking management',
      'Payment tracking',
      'Email & chat support',
      'Advanced reports',
      'Calendar sync',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: 499,
    properties: 20,
    popular: true,
    features: [
      'Up to 20 properties',
      'All Starter features',
      'Airbnb & Booking.com sync',
      'Priority support',
      'Team members',
      'Custom templates',
      'API access',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 999,
    properties: -1, // Unlimited
    features: [
      'Unlimited properties',
      'All Professional features',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'On-site training',
      'White-label options',
    ],
  },
];

export default function SubscriptionPage() {
  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/settings/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
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

  const currentPlan = data?.user.subscriptionTier || 'FREE';
  const status = data?.user.subscriptionStatus || 'TRIAL';

  return (
    <div className="space-y-6">
      <PageHeader title="Subscription" description="Manage your subscription plan and billing" />

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">
                  {plans.find((p) => p.id === currentPlan)?.name || currentPlan}
                </h3>
                <Badge
                  variant={
                    status === 'ACTIVE'
                      ? 'default'
                      : status === 'TRIAL'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {status}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {plans.find((p) => p.id === currentPlan)?.properties === -1
                  ? 'Unlimited properties'
                  : `${data?.usage.properties || 0} / ${data?.usage.propertyLimit || 1} properties used`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatCurrency(plans.find((p) => p.id === currentPlan)?.price || 0)}
              </p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
          </div>

          {status === 'TRIAL' && data?.user.trialEndsAt && (
            <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
              <p className="font-medium">Trial Period</p>
              <p className="text-sm">
                Your trial ends on {formatDate(data.user.trialEndsAt)}. Upgrade to continue using
                all features.
              </p>
            </div>
          )}

          {data?.user.subscriptionEndsAt && status === 'ACTIVE' && (
            <p className="text-sm text-gray-500">
              Next billing date: {formatDate(data.user.subscriptionEndsAt)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isUpgrade =
              plans.findIndex((p) => p.id === plan.id) >
              plans.findIndex((p) => p.id === currentPlan);

            return (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? 'border-2 border-blue-500' : ''} ${isCurrent ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                    </span>
                    {plan.price > 0 && <span className="text-sm text-gray-500">/month</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span>
                      {plan.properties === -1
                        ? 'Unlimited properties'
                        : `${plan.properties} ${plan.properties === 1 ? 'property' : 'properties'}`}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrent ? 'outline' : isUpgrade ? 'default' : 'secondary'}
                    disabled={isCurrent}
                  >
                    {isCurrent ? (
                      'Current Plan'
                    ) : isUpgrade ? (
                      <>
                        Upgrade
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'Downgrade'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <p>No billing history available</p>
            <p className="text-sm">
              Your invoices will appear here once you subscribe to a paid plan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
