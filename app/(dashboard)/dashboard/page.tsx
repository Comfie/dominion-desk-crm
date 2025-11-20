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
  upcomingCheckIns: Array<{
    id: string;
    guestName: string;
    guestPhone: string;
    checkInDate: string;
    numberOfGuests: number;
    property: { name: string };
  }>;
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your properties."
      >
        <Link href="/properties/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Properties</p>
                <p className="text-2xl font-bold">{stats?.totalProperties || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Bookings</p>
                <p className="text-2xl font-bold">{stats?.activeBookings || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tenants</p>
                <p className="text-2xl font-bold">{stats?.totalTenants || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
                {stats?.revenueChange !== 0 && (
                  <div
                    className={`flex items-center text-xs ${stats?.revenueChange && stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}
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
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inquiries</p>
                <p className="text-2xl font-bold">{stats?.pendingInquiries || 0}</p>
                <p className="text-xs text-gray-400">Pending</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Maintenance</p>
                <p className="text-2xl font-bold">{stats?.activeMaintenance || 0}</p>
                <p className="text-xs text-gray-400">Open</p>
              </div>
              <Wrench className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Occupancy Rate</p>
                <p className="text-2xl font-bold">{stats?.occupancyRate || 0}%</p>
                <p className="text-xs text-gray-400">This month</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <span className="text-sm font-bold text-blue-600">
                  {stats?.occupancyRate || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Outstanding Payments</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats?.outstandingPayments || 0)}
                </p>
                <p className="text-xs text-gray-400">To collect</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Check-ins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Check-ins</CardTitle>
              <CardDescription>Guests arriving in the next 7 days</CardDescription>
            </div>
            <Link href="/bookings">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.upcomingCheckIns && data.upcomingCheckIns.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingCheckIns.map((booking) => (
                  <Link key={booking.id} href={`/bookings/${booking.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{booking.guestName}</p>
                        <p className="text-sm text-gray-500">{booking.property.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(booking.checkInDate)}</p>
                        <p className="text-xs text-gray-500">{booking.numberOfGuests} guest(s)</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Calendar className="mx-auto mb-2 h-8 w-8" />
                <p>No upcoming check-ins</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </div>
            <Link href="/bookings">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.recentBookings && data.recentBookings.length > 0 ? (
              <div className="space-y-3">
                {data.recentBookings.map((booking) => (
                  <Link key={booking.id} href={`/bookings/${booking.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{booking.property.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
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
                        <p className="mt-1 text-sm font-medium">
                          {formatCurrency(parseFloat(booking.totalAmount))}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <CheckCircle className="mx-auto mb-2 h-8 w-8" />
                <p>No recent bookings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>Tasks due soon</CardDescription>
            </div>
            <Link href="/tasks">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.upcomingTasks && data.upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-500">Due: {formatDate(task.dueDate)}</p>
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
              <div className="py-8 text-center text-gray-500">
                <CheckCircle className="mx-auto mb-2 h-8 w-8" />
                <p>No upcoming tasks</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/bookings/new">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  New Booking
                </Button>
              </Link>
              <Link href="/inquiries">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View Inquiries
                </Button>
              </Link>
              <Link href="/maintenance/new">
                <Button variant="outline" className="w-full justify-start">
                  <Wrench className="mr-2 h-4 w-4" />
                  Log Maintenance
                </Button>
              </Link>
              <Link href="/financials/income">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </Link>
              <Link href="/tasks/new">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
              </Link>
              <Link href="/reports/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
