'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  MessageSquare,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';

import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { PageHeader } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentWithTenant {
  id: string;
  amount: number;
  dueDate?: string | null;
  paymentDate?: string;
  status: string;
  paymentReference: string;
  paymentType?: string;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  property: {
    id: string;
    name: string;
  } | null;
}

interface DashboardData {
  stats: {
    totalProperties: number;
    activeBookings: number;
    totalTenants: number;
    pendingInquiries: number;
    activeMaintenance: number;
    monthlyRevenue: number;
    revenueChange: number;
    outstandingPayments: number;
    occupancyRate: number;
    staleMaintenanceCount: number;
    activeLeases: number;
    propertiesWithTenants: number;
    tenantsMovedIn: number;
    tenantsScheduledMoveIn: number;
    paymentsWithIssuesCount: number;
  };
  charts: {
    revenue: Array<{ name: string; total: number }>;
    propertyStatus: Array<{ name: string; value: number }>;
  };
  recentBookings: Array<{
    id: string;
    guestName: string;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    totalAmount: string;
    property: { name: string };
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    taskType: string;
  }>;
  staleMaintenance: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    daysStale: number;
    property: { id: string; name: string };
  }>;
  paymentsWithIssues: PaymentWithTenant[];
  recentPaidPayments: PaymentWithTenant[];
  longTerm: {
    propertyTotal: number;
    properties: Array<{
      id: string;
      name: string;
      tenantCount: number;
      movedInCount: number;
      scheduledMoveInCount: number;
      nextMoveInDate: string | null;
    }>;
    upcomingMoveIns: Array<{
      id: string;
      moveInDate: string;
      tenantName: string;
      property: {
        id: string;
        name: string;
      };
    }>;
  };
}

async function fetchSubscriptionStatus() {
  const response = await fetch('/api/subscription/status');
  if (!response.ok) throw new Error('Failed to fetch subscription status');
  return response.json();
}

function getRevenueDirection(change: number) {
  if (change > 0) {
    return {
      icon: TrendingUp,
      tone: 'text-emerald-600',
      label: `${Math.abs(change)}% vs last month`,
    };
  }

  if (change < 0) {
    return {
      icon: TrendingDown,
      tone: 'text-red-600',
      label: `${Math.abs(change)}% vs last month`,
    };
  }

  return {
    icon: DollarSign,
    tone: 'text-muted-foreground',
    label: 'Flat vs last month',
  };
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      return response.json();
    },
    refetchInterval: 60000,
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: fetchSubscriptionStatus,
  });

  const canAddProperties = subscriptionStatus?.canAddProperties ?? true;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
          <Skeleton className="h-60" />
          <Skeleton className="h-60" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const longTerm = data?.longTerm;
  const revenueDirection = getRevenueDirection(stats?.revenueChange || 0);
  const RevenueTrendIcon = revenueDirection.icon;

  const overviewStats = [
    {
      label: 'Properties',
      value: stats?.totalProperties || 0,
      hint: `${stats?.propertiesWithTenants || 0} with active tenants`,
      icon: Building2,
      iconClassName: 'bg-primary/10 text-primary',
    },
    {
      label: 'Tenants',
      value: stats?.totalTenants || 0,
      hint: `${stats?.activeLeases || 0} active lease records`,
      icon: Users,
      iconClassName: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    },
    {
      label: 'Maintenance',
      value: stats?.activeMaintenance || 0,
      hint: `${stats?.staleMaintenanceCount || 0} aged cases`,
      icon: Wrench,
      iconClassName: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
    },
    {
      label: 'Inquiries',
      value: stats?.pendingInquiries || 0,
      hint: `${stats?.activeBookings || 0} active bookings`,
      icon: MessageSquare,
      iconClassName: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
  ];

  const focusItems = [
    {
      title: 'Collect rent',
      value: formatCurrency(stats?.outstandingPayments || 0),
      description: `${stats?.paymentsWithIssuesCount || 0} payments need follow-up`,
      href: '/financials/income',
      icon: DollarSign,
      badge:
        (stats?.paymentsWithIssuesCount || 0) > 0
          ? `${stats?.paymentsWithIssuesCount} open`
          : 'Clear',
      tone:
        (stats?.paymentsWithIssuesCount || 0) > 0
          ? 'border-yellow-200 bg-yellow-50/70 dark:border-yellow-900 dark:bg-yellow-950/30'
          : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30',
    },
    {
      title: 'Resolve maintenance',
      value: `${stats?.activeMaintenance || 0}`,
      description: `${stats?.staleMaintenanceCount || 0} requests older than 5 days`,
      href: '/maintenance',
      icon: Wrench,
      badge:
        (stats?.staleMaintenanceCount || 0) > 0
          ? `${stats?.staleMaintenanceCount} stale`
          : 'On track',
      tone:
        (stats?.staleMaintenanceCount || 0) > 0
          ? 'border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/30'
          : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30',
    },
    {
      title: 'Prepare move-ins',
      value: `${stats?.tenantsScheduledMoveIn || 0}`,
      description: 'Leases starting soon across the portfolio',
      href: '/tenants',
      icon: Calendar,
      badge:
        (stats?.tenantsScheduledMoveIn || 0) > 0
          ? `${stats?.tenantsScheduledMoveIn} upcoming`
          : 'Nothing due',
      tone: 'border-sky-200 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/30',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Action-first portfolio overview for rent collection, occupancy, and open operations."
        className="[&_h1]:text-xl md:[&_h1]:text-2xl [&_p]:text-sm"
      >
        {canAddProperties ? (
          <Link href="/properties/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </Link>
        ) : (
          <Button
            disabled
            title={subscriptionStatus?.restrictionMessage || 'Property limit reached'}
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <Card variant="premium" className="overflow-hidden">
          <CardHeader className="gap-3 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1.5">
                <Badge variant="secondary" className="w-fit text-[11px]">
                  Portfolio pulse
                </Badge>
                <CardTitle className="text-xl tracking-tight">
                  Keep the landlord focused on what moves revenue.
                </CardTitle>
                <CardDescription className="max-w-2xl text-xs leading-5">
                  This first screen now prioritizes collection risk, occupancy, and operational
                  blockers instead of stacking every report in one scroll.
                </CardDescription>
              </div>
              <div className="bg-background/70 rounded-xl border px-3.5 py-3 backdrop-blur">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
                  Occupancy
                </p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight">
                  {stats?.occupancyRate || 0}%
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {stats?.propertiesWithTenants || 0} properties currently occupied
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pt-0 pb-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="bg-background/70 rounded-xl border p-3.5">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                  Collected this month
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight">
                  {formatCurrency(stats?.monthlyRevenue || 0)}
                </p>
                <div
                  className={`mt-2 flex items-center gap-2 text-xs font-medium ${revenueDirection.tone}`}
                >
                  <RevenueTrendIcon className="h-3.5 w-3.5" />
                  <span>{revenueDirection.label}</span>
                </div>
              </div>
              <div className="bg-background/70 rounded-xl border p-3.5">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                  Outstanding now
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight">
                  {formatCurrency(stats?.outstandingPayments || 0)}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {stats?.paymentsWithIssuesCount || 0} payment issues need action
                </p>
              </div>
              <div className="bg-background/70 rounded-xl border p-3.5">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                  Lease coverage
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight">
                  {stats?.activeLeases || 0}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {stats?.tenantsScheduledMoveIn || 0} move-ins are already scheduled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base">Today&apos;s focus</CardTitle>
            <CardDescription className="text-xs">
              Three areas most likely to affect cash flow or service quality.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 px-5 pt-0 pb-5">
            {focusItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.title} href={item.href}>
                  <div
                    className={`rounded-xl border p-3.5 transition-all hover:shadow-sm ${item.tone}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="bg-background/80 flex h-9 w-9 items-center justify-center rounded-lg">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="mt-1 text-lg font-semibold tracking-tight">{item.value}</p>
                          <p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[11px]">
                        {item.badge}
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} variant="elevated" className="hover-lift">
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-xl font-semibold tracking-tight">{item.value}</p>
                  <p className="text-muted-foreground mt-1.5 text-xs">{item.hint}</p>
                </div>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${item.iconClassName}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="operations" className="space-y-3.5">
        <TabsList className="h-auto w-full justify-start rounded-xl p-1">
          <TabsTrigger value="operations" className="text-xs">
            Operations
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">
            Activity
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs">
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,1fr)]">
            <div className="space-y-5">
              <Card variant="elevated">
                <CardHeader className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Needs attention</CardTitle>
                    <CardDescription className="text-xs">
                      Short lists only. Surface the issues that can cost money or trust.
                    </CardDescription>
                  </div>
                  <Link href="/financials/income">
                    <Button variant="ghost" size="sm">
                      Open collections
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="grid gap-4 px-5 pt-0 pb-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50/70 p-3.5 dark:border-yellow-900 dark:bg-yellow-950/30">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                          Payments due or overdue
                        </p>
                        <p className="text-xs text-yellow-800/80 dark:text-yellow-200/80">
                          Follow up on arrears and verification gaps.
                        </p>
                      </div>
                      <Badge variant="secondary">{data?.paymentsWithIssues?.length || 0}</Badge>
                    </div>
                    {data?.paymentsWithIssues && data.paymentsWithIssues.length > 0 ? (
                      <div className="space-y-3">
                        {data.paymentsWithIssues.slice(0, 3).map((payment) => {
                          const isOverdue = payment.status === 'OVERDUE';
                          const daysOverdue = payment.dueDate
                            ? Math.floor(
                                (Date.now() - new Date(payment.dueDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            : 0;

                          return (
                            <Link key={payment.id} href={`/tenants/${payment.tenant?.id || ''}`}>
                              <div className="bg-background/80 rounded-lg border border-yellow-200 p-3 transition-all hover:shadow-sm dark:border-yellow-900">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {payment.tenant
                                        ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                                        : 'Unknown tenant'}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {payment.property?.name || 'No property'}
                                    </p>
                                  </div>
                                  <p className="text-xs font-semibold">
                                    {formatCurrency(Number(payment.amount))}
                                  </p>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                                  <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                                    {isOverdue
                                      ? `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`
                                      : 'Needs review'}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    {payment.dueDate ? formatDate(payment.dueDate) : 'No due date'}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-yellow-300 text-center text-sm text-yellow-900/80 dark:border-yellow-900 dark:text-yellow-100/80">
                        No payment issues right now.
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 dark:border-red-900 dark:bg-red-950/30">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                          Aged maintenance
                        </p>
                        <p className="text-xs text-red-800/80 dark:text-red-200/80">
                          Keep old requests visible until they are closed.
                        </p>
                      </div>
                      <Badge variant="secondary">{data?.staleMaintenance?.length || 0}</Badge>
                    </div>
                    {data?.staleMaintenance && data.staleMaintenance.length > 0 ? (
                      <div className="space-y-3">
                        {data.staleMaintenance.slice(0, 3).map((request) => (
                          <Link key={request.id} href={`/maintenance/${request.id}`}>
                            <div className="bg-background/80 rounded-lg border border-red-200 p-3 transition-all hover:shadow-sm dark:border-red-900">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium">{request.title}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {request.property.name}
                                  </p>
                                </div>
                                <Badge variant="destructive">{request.daysStale}d</Badge>
                              </div>
                              <p className="text-muted-foreground mt-3 text-xs">
                                {request.priority} priority · {request.status}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-red-300 text-center text-sm text-red-900/80 dark:border-red-900 dark:text-red-100/80">
                        No stale maintenance requests.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card variant="elevated">
                  <CardHeader className="flex flex-row items-center justify-between p-5">
                    <div>
                      <CardTitle className="text-base">Upcoming move-ins</CardTitle>
                      <CardDescription className="text-xs">
                        Prepare keys, deposits, and handover.
                      </CardDescription>
                    </div>
                    <Link href="/tenants">
                      <Button variant="ghost" size="sm">
                        View all
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="px-5 pt-0 pb-5">
                    {longTerm?.upcomingMoveIns && longTerm.upcomingMoveIns.length > 0 ? (
                      <div className="space-y-3">
                        {longTerm.upcomingMoveIns.slice(0, 4).map((lease) => (
                          <Link key={lease.id} href={`/properties/${lease.property.id}`}>
                            <div className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3 transition-all hover:shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
                                  <Users className="text-primary h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {lease.tenantName || 'Tenant'}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {lease.property.name}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold">
                                  {formatDate(lease.moveInDate)}
                                </p>
                                <p className="text-muted-foreground text-xs">Move-in date</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex h-44 flex-col items-center justify-center text-center">
                        <Calendar className="mb-3 h-8 w-8 opacity-30" />
                        <p>No upcoming move-ins</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardHeader className="flex flex-row items-center justify-between p-5">
                    <div>
                      <CardTitle className="text-base">Upcoming tasks</CardTitle>
                      <CardDescription className="text-xs">
                        Keep the next few due items visible.
                      </CardDescription>
                    </div>
                    <Link href="/tasks">
                      <Button variant="ghost" size="sm">
                        View all
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="px-5 pt-0 pb-5">
                    {data?.upcomingTasks && data.upcomingTasks.length > 0 ? (
                      <div className="space-y-3">
                        {data.upcomingTasks.slice(0, 4).map((task) => (
                          <Link key={task.id} href={`/tasks/${task.id}`}>
                            <div className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3 transition-all hover:shadow-sm">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                    task.priority === 'URGENT'
                                      ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300'
                                      : 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                                  }`}
                                >
                                  <Clock className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{task.title}</p>
                                  <p className="text-muted-foreground text-xs">
                                    Due {formatDate(task.dueDate)}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  task.priority === 'URGENT'
                                    ? 'destructive'
                                    : task.priority === 'HIGH'
                                      ? 'default'
                                      : 'outline'
                                }
                              >
                                {task.priority}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex h-44 flex-col items-center justify-center text-center">
                        <CheckCircle className="mb-3 h-8 w-8 opacity-30" />
                        <p>No upcoming tasks</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-5">
              <Card variant="elevated">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base">Quick actions</CardTitle>
                  <CardDescription className="text-xs">
                    Shortcuts for the workflows landlords use most often.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2.5 px-5 pt-0 pb-5">
                  <Link href="/financials/income">
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start px-3.5 py-3 text-left"
                    >
                      <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                        <DollarSign className="h-4.5 w-4.5 text-emerald-700 dark:text-emerald-300" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold">Record payment</span>
                        <span className="text-muted-foreground text-xs">
                          Capture or review collections
                        </span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/maintenance/new">
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start px-3.5 py-3 text-left"
                    >
                      <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40">
                        <Wrench className="h-4.5 w-4.5 text-orange-700 dark:text-orange-300" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold">Log maintenance</span>
                        <span className="text-muted-foreground text-xs">
                          Create a new maintenance case
                        </span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/tenants/new">
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start px-3.5 py-3 text-left"
                    >
                      <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/40">
                        <Users className="h-4.5 w-4.5 text-sky-700 dark:text-sky-300" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold">Add tenant</span>
                        <span className="text-muted-foreground text-xs">
                          Start a new long-term tenancy record
                        </span>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/properties/new">
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start px-3.5 py-3 text-left"
                    >
                      <div className="bg-primary/10 mr-3 flex h-9 w-9 items-center justify-center rounded-lg">
                        <Building2 className="text-primary h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold">Add property</span>
                        <span className="text-muted-foreground text-xs">
                          Expand the managed portfolio
                        </span>
                      </div>
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base">Lease snapshot</CardTitle>
                  <CardDescription className="text-xs">
                    Tight lease status view for occupancy and upcoming handovers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 px-5 pt-0 pb-5">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border p-3">
                      <p className="text-muted-foreground text-[11px] font-medium tracking-[0.14em] uppercase">
                        Active leases
                      </p>
                      <p className="mt-1 text-lg font-semibold">{stats?.activeLeases || 0}</p>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-muted-foreground text-[11px] font-medium tracking-[0.14em] uppercase">
                        Occupied properties
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {stats?.propertiesWithTenants || 0}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border">
                    <div className="flex items-center justify-between border-b px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold">Lease flow</p>
                        <p className="text-muted-foreground text-xs">
                          What is occupied now and what is landing next.
                        </p>
                      </div>
                      <Link href="/tenants">
                        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs">
                          View tenants
                        </Button>
                      </Link>
                    </div>
                    <div className="divide-y">
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium">Tenants moved in</p>
                          <p className="text-muted-foreground text-xs">Currently occupying units</p>
                        </div>
                        <span className="text-sm font-semibold">{stats?.tenantsMovedIn || 0}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium">Scheduled move-ins</p>
                          <p className="text-muted-foreground text-xs">Upcoming lease starts</p>
                        </div>
                        <span className="text-sm font-semibold">
                          {stats?.tenantsScheduledMoveIn || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium">Properties with tenants</p>
                          <p className="text-muted-foreground text-xs">Occupied long-term stock</p>
                        </div>
                        <span className="text-sm font-semibold">
                          {stats?.propertiesWithTenants || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <Card
              variant="elevated"
              className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
            >
              <CardHeader className="flex flex-row items-center justify-between p-5">
                <div>
                  <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">
                    Recent paid payments
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Keep successful collections visible without mixing them into the action view.
                  </CardDescription>
                </div>
                <Link href="/financials/income">
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-5 pt-0 pb-5">
                {data?.recentPaidPayments && data.recentPaidPayments.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentPaidPayments.slice(0, 4).map((payment) => (
                      <Link key={payment.id} href={`/tenants/${payment.tenant?.id || ''}`}>
                        <div className="bg-background/80 flex items-start justify-between rounded-xl border border-emerald-200 p-3 transition-all hover:shadow-sm dark:border-emerald-900">
                          <div>
                            <p className="text-sm font-medium">
                              {payment.tenant
                                ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                                : 'Unknown tenant'}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {payment.property?.name || 'No property'}
                            </p>
                            <p className="text-muted-foreground mt-2 text-xs">
                              Ref: {payment.paymentReference}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                              {formatCurrency(Number(payment.amount))}
                            </p>
                            <Badge className="mt-2 bg-emerald-600">Paid</Badge>
                            <p className="text-muted-foreground mt-2 text-xs">
                              {payment.paymentDate
                                ? formatDate(payment.paymentDate)
                                : 'No payment date'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground flex h-56 flex-col items-center justify-center text-center">
                    <CheckCircle className="mb-3 h-8 w-8 opacity-30" />
                    <p>No recent paid payments</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between p-5">
                <div>
                  <CardTitle className="text-base">Recent bookings</CardTitle>
                  <CardDescription className="text-xs">
                    Available as a separate activity stream so it does not dominate the landing
                    view.
                  </CardDescription>
                </div>
                <Link href="/bookings">
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-5 pt-0 pb-5">
                {data?.recentBookings && data.recentBookings.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentBookings.slice(0, 4).map((booking) => (
                      <Link key={booking.id} href={`/bookings/${booking.id}`}>
                        <div className="hover:bg-muted/40 flex items-start justify-between rounded-xl border p-3 transition-all hover:shadow-sm">
                          <div>
                            <p className="text-sm font-medium">{booking.property.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {formatDate(booking.checkInDate)} to{' '}
                              {formatDate(booking.checkOutDate)}
                            </p>
                            <p className="text-muted-foreground mt-2 text-xs">
                              Guest: {booking.guestName}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                booking.status === 'CONFIRMED'
                                  ? 'default'
                                  : booking.status === 'CHECKED_IN'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {booking.status}
                            </Badge>
                            <p className="mt-2 text-xs font-semibold">
                              {formatCurrency(parseFloat(booking.totalAmount))}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground flex h-56 flex-col items-center justify-center text-center">
                    <Calendar className="mb-3 h-8 w-8 opacity-30" />
                    <p>No recent bookings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-5">
          {data?.charts && <DashboardCharts data={data.charts} />}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between p-5">
                <div>
                  <CardTitle className="text-base">Properties with tenants</CardTitle>
                  <CardDescription className="text-xs">
                    Compact occupancy list for quick scanning.
                  </CardDescription>
                </div>
                <Link href="/properties">
                  <Button variant="ghost" size="sm">
                    View properties
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="px-5 pt-0 pb-5">
                {longTerm?.properties && longTerm.properties.length > 0 ? (
                  <div className="space-y-3">
                    {longTerm.properties.slice(0, 4).map((property) => (
                      <Link key={property.id} href={`/properties/${property.id}`}>
                        <div className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3 transition-all hover:shadow-sm">
                          <div>
                            <p className="text-sm font-medium">{property.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {property.movedInCount} moved in · {property.scheduledMoveInCount}{' '}
                              scheduled
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">{property.tenantCount} tenant(s)</Badge>
                            {property.nextMoveInDate && (
                              <p className="text-muted-foreground mt-2 text-xs">
                                Next move-in {formatDate(property.nextMoveInDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground flex h-48 items-center justify-center rounded-xl border border-dashed text-sm">
                    No active long-term tenants yet
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base">Portfolio health</CardTitle>
                <CardDescription className="text-xs">
                  Analytics stay here so the landing screen remains focused.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pt-0 pb-5">
                <div className="rounded-xl border p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                      Occupancy rate
                    </p>
                    <Building2 className="text-primary h-4 w-4" />
                  </div>
                  <p className="mt-1.5 text-2xl font-semibold">{stats?.occupancyRate || 0}%</p>
                </div>
                <div className="rounded-xl border p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                      Monthly revenue
                    </p>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-1.5 text-2xl font-semibold">
                    {formatCurrency(stats?.monthlyRevenue || 0)}
                  </p>
                </div>
                <div className="rounded-xl border p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                      Outstanding payments
                    </p>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="mt-1.5 text-2xl font-semibold">
                    {formatCurrency(stats?.outstandingPayments || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
