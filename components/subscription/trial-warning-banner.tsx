'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SubscriptionStatusData {
  isOnTrial: boolean;
  trialDaysRemaining: number | null;
  subscriptionStatus: string;
  restrictionLevel: 'NONE' | 'WARNING' | 'LIMITED' | 'READONLY' | 'SUSPENDED';
  restrictionMessage: string | null;
}

/**
 * TrialWarningBanner - Displays a warning banner when trial is about to expire or has expired
 * Shows different messages based on restriction level:
 * - NONE: No banner
 * - WARNING: Trial expired, subscribe within X days
 * - LIMITED: Cannot add properties/bookings
 * - READONLY: View only mode
 * - SUSPENDED: Account suspended
 */
export function TrialWarningBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data, isLoading } = useQuery<SubscriptionStatusData>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/status');
      if (!response.ok) throw new Error('Failed to fetch subscription status');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Don't show anything while loading or if no data
  if (isLoading || !data) return null;

  // No banner needed for active subscriptions or trial with no issues
  if (data.restrictionLevel === 'NONE') {
    // Show a subtle reminder if trial is ending soon (7 days or less)
    if (
      data.isOnTrial &&
      data.trialDaysRemaining !== null &&
      data.trialDaysRemaining <= 7 &&
      !dismissed
    ) {
      return (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex w-full items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              Your trial ends in {data.trialDaysRemaining} day
              {data.trialDaysRemaining !== 1 ? 's' : ''}.{' '}
              <Link href="/settings/subscription" className="font-medium underline">
                Subscribe now
              </Link>{' '}
              to continue managing your properties.
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  }

  // Determine banner style based on restriction level
  const bannerStyles = {
    WARNING: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
    LIMITED: 'bg-orange-50 border-orange-300 dark:bg-orange-950/20 dark:border-orange-800',
    READONLY: 'bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-800',
    SUSPENDED: 'bg-red-100 border-red-400 dark:bg-red-950/30 dark:border-red-700',
  };

  const iconColors = {
    WARNING: 'text-yellow-600',
    LIMITED: 'text-orange-600',
    READONLY: 'text-red-600',
    SUSPENDED: 'text-red-700',
  };

  const textColors = {
    WARNING: 'text-yellow-800 dark:text-yellow-200',
    LIMITED: 'text-orange-800 dark:text-orange-200',
    READONLY: 'text-red-800 dark:text-red-200',
    SUSPENDED: 'text-red-900 dark:text-red-100',
  };

  return (
    <Alert className={bannerStyles[data.restrictionLevel]}>
      <AlertTriangle className={`h-4 w-4 ${iconColors[data.restrictionLevel]}`} />
      <AlertDescription className="flex w-full items-center justify-between">
        <span className={textColors[data.restrictionLevel]}>
          {data.restrictionMessage}{' '}
          <Link href="/settings/subscription" className="font-medium underline">
            View subscription options
          </Link>
        </span>
      </AlertDescription>
    </Alert>
  );
}
