'use client';

import { useCallback, useEffect, useState } from 'react';
import { StatsCard } from '@/components/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  DollarSign,
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Calendar,
  UsersRound,
  TrendingDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Analytics {
  metrics: {
    totalMRR: number;
    totalLandlords: number;
    activeLandlords: number;
    trialUsers: number;
    totalProperties: number;
    totalBookings: number;
    totalTenants: number;
    churnRate: number;
  };
  revenueByTier: {
    FREE: number;
    STARTER: number;
    PROFESSIONAL: number;
    ENTERPRISE: number;
  };
  recentSignups: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    subscriptionTier: string;
    createdAt: string;
  }>;
  recentCancellations: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    subscriptionTier: string;
    updatedAt: string;
  }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/45 border-r-transparent"></div>
          <p className="mt-2 text-white/55">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div>Failed to load analytics</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-hero">
          <div className="space-y-4">
            <span className="admin-kicker">Platform intelligence</span>
            <div className="space-y-2">
              <h1 className="admin-page-title font-semibold">Platform Analytics</h1>
              <p className="admin-page-description">
                Track revenue, adoption, signups, and churn metrics across the full platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total MRR"
          value={`R${analytics.metrics.totalMRR.toLocaleString()}`}
          description="Monthly Recurring Revenue"
          icon={DollarSign}
        />
        <StatsCard
          title="Total Landlords"
          value={analytics.metrics.totalLandlords}
          description="All registered landlords"
          icon={Users}
        />
        <StatsCard
          title="Active Landlords"
          value={analytics.metrics.activeLandlords}
          description="With active subscriptions"
          icon={UserCheck}
        />
        <StatsCard
          title="Trial Users"
          value={analytics.metrics.trialUsers}
          description="Currently on trial"
          icon={UserPlus}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Properties"
          value={analytics.metrics.totalProperties}
          description="Across all landlords"
          icon={Building2}
        />
        <StatsCard
          title="Total Bookings"
          value={analytics.metrics.totalBookings}
          description="All-time bookings"
          icon={Calendar}
        />
        <StatsCard
          title="Total Tenants"
          value={analytics.metrics.totalTenants}
          description="Registered tenants"
          icon={UsersRound}
        />
        <StatsCard
          title="Churn Rate"
          value={`${analytics.metrics.churnRate}%`}
          description="Last 30 days"
          icon={TrendingDown}
        />
      </div>

      <Card className="admin-panel">
        <CardHeader>
          <CardTitle className="text-white">Revenue by Subscription Tier</CardTitle>
          <CardDescription className="text-white/60">
            Monthly recurring revenue breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-white/55">Free</span>
              <span className="text-2xl font-bold text-white">R{analytics.revenueByTier.FREE}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-white/55">Starter</span>
              <span className="text-2xl font-bold text-white">
                R{analytics.revenueByTier.STARTER.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-white/55">Professional</span>
              <span className="text-2xl font-bold text-white">
                R{analytics.revenueByTier.PROFESSIONAL.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-white/55">Enterprise</span>
              <span className="text-2xl font-bold text-white">
                R{analytics.revenueByTier.ENTERPRISE.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="admin-panel">
          <CardHeader>
            <CardTitle className="text-white">Recent Signups</CardTitle>
            <CardDescription className="text-white/60">Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentSignups.length === 0 ? (
              <p className="text-sm text-white/55">No recent signups</p>
            ) : (
              <div className="space-y-4">
                {analytics.recentSignups.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-white/55">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{user.subscriptionTier}</Badge>
                      <p className="mt-1 text-xs text-white/45">
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="admin-panel">
          <CardHeader>
            <CardTitle className="text-white">Recent Cancellations</CardTitle>
            <CardDescription className="text-white/60">Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentCancellations.length === 0 ? (
              <p className="text-sm text-white/55">No recent cancellations</p>
            ) : (
              <div className="space-y-4">
                {analytics.recentCancellations.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-white/55">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{user.subscriptionTier}</Badge>
                      <p className="mt-1 text-xs text-white/45">
                        {formatDistanceToNow(new Date(user.updatedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
