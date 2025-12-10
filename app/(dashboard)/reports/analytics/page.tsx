'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Users,
  MessageSquare,
  Wrench,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  PieChart,
  ArrowRight,
} from 'lucide-react';

import { PageHeader, Loading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AnalyticsData {
  summary: {
    totalProperties: number;
    totalBookings: number;
    totalTenants: number;
    totalInquiries: number;
    pendingInquiries: number;
    activeMaintenance: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    outstandingPayments: number;
    occupancyRate: number;
    conversionRate: number;
  };
  charts: {
    revenueByMonth: { month: string; revenue: number }[];
    bookingSources: { source: string; count: number }[];
  };
  recentActivity: {
    bookings: {
      id: string;
      guestName: string;
      checkInDate: string;
      status: string;
      createdAt: string;
      property: { name: string };
    }[];
    inquiries: {
      id: string;
      contactName: string;
      status: string;
      createdAt: string;
      property: { name: string } | null;
    }[];
  };
}

export default function AnalyticsDashboardPage() {
  const [period, setPeriod] = useState('30');

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const response = await fetch(`/api/reports/analytics?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics Dashboard"
          description="Overview of your property management metrics"
        />
        <Loading
          size="xl"
          text="Loading analytics data..."
          submessage="This may take a few moments"
          className="py-12"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        description="Overview of your property management metrics"
      >
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalProperties}</div>
            <p className="text-muted-foreground text-xs">Active properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.summary.totalRevenue || 0)}
            </div>
            <p className="text-muted-foreground text-xs">Last {period} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.occupancyRate}%</div>
            <p className="text-muted-foreground text-xs">Average occupancy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            {(data?.summary.netIncome || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (data?.summary.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data?.summary.netIncome || 0)}
            </div>
            <p className="text-muted-foreground text-xs">Revenue - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalTenants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inquiries</CardTitle>
            <MessageSquare className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.pendingInquiries}</div>
            <p className="text-muted-foreground text-xs">
              Conversion rate: {data?.summary.conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(data?.summary.outstandingPayments || 0)}
            </div>
            <p className="text-muted-foreground text-xs">Unpaid balances</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.charts.revenueByMonth && data.charts.revenueByMonth.length > 0 ? (
              <div className="space-y-2">
                {data.charts.revenueByMonth.slice(-6).map((item) => (
                  <div key={item.month} className="flex items-center gap-2">
                    <div className="w-20 text-sm text-gray-500">
                      {new Date(item.month + '-01').toLocaleDateString('en-ZA', {
                        month: 'short',
                        year: '2-digit',
                      })}
                    </div>
                    <div className="flex-1">
                      <div
                        className="h-6 rounded bg-blue-500"
                        style={{
                          width: `${
                            (item.revenue /
                              Math.max(...data.charts.revenueByMonth.map((m) => m.revenue), 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="w-24 text-right text-sm font-medium">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No revenue data available</p>
            )}
            <div className="mt-4">
              <Link href="/reports/revenue">
                <Button variant="outline" size="sm">
                  View Full Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Booking Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Booking Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.charts.bookingSources && data.charts.bookingSources.length > 0 ? (
              <div className="space-y-3">
                {data.charts.bookingSources.map((source) => {
                  const total = data.charts.bookingSources.reduce((sum, s) => sum + s.count, 0);
                  const percentage = total > 0 ? (source.count / total) * 100 : 0;

                  return (
                    <div key={source.source} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{source.source.replace('_', ' ')}</span>
                        <span className="font-medium">
                          {source.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No booking data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentActivity.bookings && data.recentActivity.bookings.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.bookings.map((booking) => (
                  <Link key={booking.id} href={`/bookings/${booking.id}`}>
                    <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors">
                      <div>
                        <p className="font-medium">{booking.guestName}</p>
                        <p className="text-muted-foreground text-sm">{booking.property.name}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            booking.status === 'CONFIRMED'
                              ? 'default'
                              : booking.status === 'PENDING'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {booking.status}
                        </Badge>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatDate(booking.checkInDate)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No recent bookings</p>
            )}
            <div className="mt-4">
              <Link href="/bookings">
                <Button variant="outline" size="sm" className="w-full">
                  View All Bookings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentActivity.inquiries && data.recentActivity.inquiries.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.inquiries.map((inquiry) => (
                  <Link key={inquiry.id} href={`/inquiries/${inquiry.id}`}>
                    <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors">
                      <div>
                        <p className="font-medium">{inquiry.contactName}</p>
                        <p className="text-muted-foreground text-sm">
                          {inquiry.property?.name || 'General inquiry'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            inquiry.status === 'NEW'
                              ? 'default'
                              : inquiry.status === 'IN_PROGRESS'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {inquiry.status}
                        </Badge>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatDate(inquiry.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No recent inquiries</p>
            )}
            <div className="mt-4">
              <Link href="/inquiries">
                <Button variant="outline" size="sm" className="w-full">
                  View All Inquiries
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/reports/occupancy">
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <Calendar className="text-primary h-8 w-8" />
                  <div>
                    <p className="font-medium">Occupancy Report</p>
                    <p className="text-muted-foreground text-sm">View occupancy by property</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports/revenue">
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <DollarSign className="text-accent h-8 w-8" />
                  <div>
                    <p className="font-medium">Revenue Report</p>
                    <p className="text-muted-foreground text-sm">Income and expense analysis</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports/tenant-payments">
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <Users className="text-primary h-8 w-8" />
                  <div>
                    <p className="font-medium">Tenant Payments</p>
                    <p className="text-muted-foreground text-sm">Payment history by tenant</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports/lease-expiration">
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <Calendar className="text-primary h-8 w-8" />
                  <div>
                    <p className="font-medium">Lease Expiration</p>
                    <p className="text-muted-foreground text-sm">Upcoming lease renewals</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports/aging-receivables">
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertCircle className="text-primary h-8 w-8" />
                  <div>
                    <p className="font-medium">Aging Receivables</p>
                    <p className="text-muted-foreground text-sm">Outstanding payment aging</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports/maintenance-costs">
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <Wrench className="text-primary h-8 w-8" />
                  <div>
                    <p className="font-medium">Maintenance Costs</p>
                    <p className="text-muted-foreground text-sm">Property maintenance expenses</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports/cash-flow">
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <DollarSign className="text-primary h-8 w-8" />
                  <div>
                    <p className="font-medium">Cash Flow</p>
                    <p className="text-muted-foreground text-sm">Inflows and outflows</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/financials/income">
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <Calendar className="text-primary h-8 w-8" />
                  <div>
                    <p className="font-medium">Financial Details</p>
                    <p className="text-muted-foreground text-sm">View all transactions</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
