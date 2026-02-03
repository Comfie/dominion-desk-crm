'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  Users,
  DollarSign,
  MessageSquare,
  Wrench,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const longTerm = data?.longTerm;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your properties."
      >
        <Link href="/properties/new">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="elevated" className="hover-lift">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Properties</p>
                <p className="mt-2 text-lg font-bold tracking-tight">
                  {stats?.totalProperties || 0}
                </p>
              </div>
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Building2 className="text-primary h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="hover-lift">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Tenants</p>
                <p className="mt-2 text-lg font-bold tracking-tight">{stats?.totalTenants || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Users className="text-chart-3 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="hover-lift">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Active Leases</p>
                <p className="mt-2 text-lg font-bold tracking-tight">{stats?.activeLeases || 0}</p>
                <p className="text-muted-foreground/70 text-xs">Long-term tenants</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <Users className="text-chart-2 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="hover-lift">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Maintenance</p>
                <p className="mt-2 text-lg font-bold tracking-tight">
                  {stats?.activeMaintenance || 0}
                </p>
                <p className="text-muted-foreground/70 text-xs">Open requests</p>
              </div>
              <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Wrench className="text-destructive h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Long-term Overview */}
      <Card variant="elevated" className="hover-lift">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Long-term Tenancies</CardTitle>
            <CardDescription>Active leases, move-ins, and occupied properties</CardDescription>
          </div>
          <Link href="/tenants">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              View Tenants
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-muted/30 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm font-medium">Properties with Tenants</p>
                <Building2 className="text-primary h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {stats?.propertiesWithTenants || 0}
              </p>
              <p className="text-muted-foreground/70 text-xs">Active lease properties</p>
            </div>
            <div className="bg-muted/30 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm font-medium">Tenants Moved In</p>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">{stats?.tenantsMovedIn || 0}</p>
              <p className="text-muted-foreground/70 text-xs">Currently occupying</p>
            </div>
            <div className="bg-muted/30 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm font-medium">Scheduled Move-ins</p>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {stats?.tenantsScheduledMoveIn || 0}
              </p>
              <p className="text-muted-foreground/70 text-xs">Future lease starts</p>
            </div>
            <div className="bg-muted/30 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm font-medium">Active Leases</p>
                <Users className="text-chart-3 h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">{stats?.activeLeases || 0}</p>
              <p className="text-muted-foreground/70 text-xs">Open lease records</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Properties with tenants</p>
              <Link href="/properties">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                >
                  View Properties
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {longTerm?.properties && longTerm.properties.length > 0 ? (
              <div className="space-y-3">
                {longTerm.properties.map((property) => (
                  <Link key={property.id} href={`/properties/${property.id}`}>
                    <div className="hover:bg-muted/50 group flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-sm">
                      <div>
                        <p className="group-hover:text-primary font-semibold">{property.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {property.movedInCount} moved in · {property.scheduledMoveInCount}{' '}
                          scheduled
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">
                          {property.tenantCount} tenant(s)
                        </Badge>
                        {property.nextMoveInDate && (
                          <p className="text-muted-foreground text-xs">
                            Next move-in {formatDate(property.nextMoveInDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground flex h-32 items-center justify-center rounded-lg border border-dashed text-sm">
                No active long-term tenants yet
              </div>
            )}
            {longTerm?.propertyTotal && longTerm.propertyTotal > longTerm.properties.length && (
              <p className="text-muted-foreground mt-3 text-xs">
                Showing {longTerm.properties.length} of {longTerm.propertyTotal} properties with
                tenants.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Stats */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <Card variant="premium" className="hover-lift">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Occupancy Rate</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  {stats?.occupancyRate || 0}%
                </p>
                <p className="text-muted-foreground/70 text-sm">Current month</p>
              </div>
              <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
                <span className="text-lg font-bold">{stats?.occupancyRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="premium" className="hover-lift">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Monthly Revenue</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  {formatCurrency(stats?.monthlyRevenue || 0)}
                </p>
                {stats?.revenueChange !== 0 && (
                  <div
                    className={`mt-1 flex items-center text-xs font-medium ${stats?.revenueChange && stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {stats?.revenueChange && stats.revenueChange > 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {Math.abs(stats?.revenueChange || 0)}%
                  </div>
                )}
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="premium" className="hover-lift">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Outstanding Payments</p>
                <p className="text-destructive mt-2 text-2xl font-bold tracking-tight">
                  {formatCurrency(stats?.outstandingPayments || 0)}
                </p>
                <p className="text-muted-foreground/70 text-sm">To collect</p>
              </div>
              <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
                <AlertCircle className="text-destructive h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts */}
      {data?.charts && <DashboardCharts data={data.charts} />}

      {/* Stale Maintenance Alert */}
      {data?.staleMaintenance && data.staleMaintenance.length > 0 && (
        <Card variant="elevated" className="border-destructive/50 bg-destructive/5 hover-lift">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-destructive/20 flex h-8 w-8 items-center justify-center rounded-full">
                <AlertCircle className="text-destructive h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-destructive text-lg">Attention Required</CardTitle>
                <CardDescription>
                  {data.staleMaintenance.length} maintenance request(s) pending for 5+ days
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.staleMaintenance.map((request) => (
                <Link key={request.id} href={`/maintenance/${request.id}`}>
                  <div className="hover:bg-destructive/10 group flex items-center justify-between rounded-lg border bg-white p-4 transition-all dark:bg-black">
                    <div>
                      <p className="group-hover:text-destructive font-semibold">{request.title}</p>
                      <p className="text-muted-foreground text-sm">{request.property.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-1">
                        {request.daysStale} days old
                      </Badge>
                      <p className="text-muted-foreground text-xs">{request.status}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/maintenance">
                <Button variant="outline" className="w-full">
                  <Wrench className="mr-2 h-4 w-4" />
                  View All Maintenance
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments With Issues (Due/Overdue) */}
      {data?.paymentsWithIssues && data.paymentsWithIssues.length > 0 && (
        <Card
          variant="elevated"
          className="hover-lift border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/30"
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600/20">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">
                  Payments Requiring Attention
                </CardTitle>
                <CardDescription>
                  {data.paymentsWithIssues.length} payment
                  {data.paymentsWithIssues.length > 1 ? 's' : ''} due or overdue
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.paymentsWithIssues.slice(0, 5).map((payment) => {
                const isOverdue = payment.status === 'OVERDUE';
                const daysOverdue = payment.dueDate
                  ? Math.floor(
                      (new Date().getTime() - new Date(payment.dueDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;
                return (
                  <Link key={payment.id} href={`/tenants/${payment.tenant?.id}`}>
                    <div
                      className={`group flex items-center justify-between rounded-lg border p-4 transition-all ${
                        isOverdue
                          ? 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/50'
                          : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950/50'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">
                          {payment.tenant
                            ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                            : 'Unknown'}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {payment.property?.name || 'No property'}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Ref: {payment.paymentReference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(Number(payment.amount))}</p>
                        <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="mb-1">
                          {isOverdue
                            ? `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`
                            : payment.status}
                        </Badge>
                        <p className="text-muted-foreground text-xs">
                          Due: {payment.dueDate ? formatDate(payment.dueDate) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {data.paymentsWithIssues.length > 5 && (
              <p className="text-muted-foreground mt-3 text-xs">
                Showing 5 of {data.paymentsWithIssues.length} payments with issues
              </p>
            )}
            <div className="mt-6">
              <Link href="/financials/income">
                <Button variant="outline" className="w-full">
                  <DollarSign className="mr-2 h-4 w-4" />
                  View All Payments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Paid Payments */}
      {data?.recentPaidPayments && data.recentPaidPayments.length > 0 && (
        <Card
          variant="elevated"
          className="hover-lift border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30"
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-green-800 dark:text-green-200">
                  Recent Paid Payments
                </CardTitle>
                <CardDescription>
                  {data.recentPaidPayments.length} payment
                  {data.recentPaidPayments.length > 1 ? 's' : ''} received recently
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentPaidPayments.slice(0, 5).map((payment) => (
                <Link key={payment.id} href={`/tenants/${payment.tenant?.id}`}>
                  <div className="group flex items-center justify-between rounded-lg border border-green-200 bg-white p-4 transition-all hover:bg-green-100 dark:border-green-800 dark:bg-green-950/50 dark:hover:bg-green-950/70">
                    <div>
                      <p className="font-semibold">
                        {payment.tenant
                          ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                          : 'Unknown'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {payment.property?.name || 'No property'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Ref: {payment.paymentReference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(Number(payment.amount))}
                      </p>
                      <Badge variant="default" className="mb-1 bg-green-600">
                        PAID
                      </Badge>
                      <p className="text-muted-foreground text-xs">
                        {payment.paymentDate ? formatDate(payment.paymentDate) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {data.recentPaidPayments.length > 5 && (
              <p className="text-muted-foreground mt-3 text-xs">
                Showing 5 of {data.recentPaidPayments.length} recent payments
              </p>
            )}
            <div className="mt-6">
              <Link href="/financials/income">
                <Button variant="outline" className="w-full">
                  <DollarSign className="mr-2 h-4 w-4" />
                  View All Payments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Upcoming Move-ins */}
        <Card variant="elevated" className="hover-lift h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Upcoming Move-ins</CardTitle>
              <CardDescription>Tenants moving in within 30 days</CardDescription>
            </div>
            <Link href="/tenants">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {longTerm?.upcomingMoveIns && longTerm.upcomingMoveIns.length > 0 ? (
              <div className="space-y-4">
                {longTerm.upcomingMoveIns.map((lease) => (
                  <Link key={lease.id} href={`/properties/${lease.property.id}`}>
                    <div className="hover:bg-muted/50 group hover:border-primary/20 flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 group-hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-full">
                          <Users className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{lease.tenantName || 'Tenant'}</p>
                          <p className="text-muted-foreground text-sm">{lease.property.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(lease.moveInDate)}</p>
                        <p className="text-muted-foreground text-xs">Scheduled move-in</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground flex h-48 flex-col items-center justify-center text-center">
                <Calendar className="mb-4 h-10 w-10 opacity-20" />
                <p>No upcoming move-ins</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card variant="elevated" className="hover-lift h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Recent Bookings</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </div>
            <Link href="/bookings">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.recentBookings && data.recentBookings.length > 0 ? (
              <div className="space-y-4">
                {data.recentBookings.map((booking) => (
                  <Link key={booking.id} href={`/bookings/${booking.id}`}>
                    <div className="hover:bg-muted/50 group hover:border-primary/20 flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
                          <Calendar className="text-foreground h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{booking.property.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                          </p>
                        </div>
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
                          className="mb-1"
                        >
                          {booking.status}
                        </Badge>
                        <p className="text-sm font-semibold">
                          {formatCurrency(parseFloat(booking.totalAmount))}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground flex h-48 flex-col items-center justify-center text-center">
                <CheckCircle className="mb-4 h-10 w-10 opacity-20" />
                <p>No recent bookings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card variant="elevated" className="hover-lift h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Upcoming Tasks</CardTitle>
              <CardDescription>Tasks due soon</CardDescription>
            </div>
            <Link href="/tasks">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.upcomingTasks && data.upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {data.upcomingTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="hover:bg-muted/50 group hover:border-primary/20 flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-sm">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${task.priority === 'URGENT' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                        >
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{task.title}</p>
                          <p className="text-muted-foreground text-sm">
                            Due: {formatDate(task.dueDate)}
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
              <div className="text-muted-foreground flex h-48 flex-col items-center justify-center text-center">
                <CheckCircle className="mb-4 h-10 w-10 opacity-20" />
                <p>No upcoming tasks</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="elevated" className="hover-lift h-full">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/bookings/new">
                <Button variant="outline" className="h-auto w-full justify-start py-4 text-left">
                  <div className="bg-primary/10 mr-3 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Calendar className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <span className="block font-semibold">New Booking</span>
                    <span className="text-muted-foreground text-xs">Register a guest</span>
                  </div>
                </Button>
              </Link>
              <Link href="/inquiries">
                <Button variant="outline" className="h-auto w-full justify-start py-4 text-left">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="block font-semibold">View Inquiries</span>
                    <span className="text-muted-foreground text-xs">Check messages</span>
                  </div>
                </Button>
              </Link>
              <Link href="/maintenance/new">
                <Button variant="outline" className="h-auto w-full justify-start py-4 text-left">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <Wrench className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <span className="block font-semibold">Log Maintenance</span>
                    <span className="text-muted-foreground text-xs">Report an issue</span>
                  </div>
                </Button>
              </Link>
              <Link href="/financials/income">
                <Button variant="outline" className="h-auto w-full justify-start py-4 text-left">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <span className="block font-semibold">Record Payment</span>
                    <span className="text-muted-foreground text-xs">Add income</span>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
