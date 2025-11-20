'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Calendar, Building2, TrendingUp, TrendingDown, Download } from 'lucide-react';

import { PageHeader, Loading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface OccupancyData {
  summary: {
    totalProperties: number;
    dateRange: { start: string; end: string };
    daysInRange: number;
    totalAvailableDays: number;
    totalOccupiedDays: number;
    overallOccupancy: number;
    totalRevenue: number;
    averageOccupancy: number;
  };
  byProperty: {
    property: {
      id: string;
      name: string;
      rentalType: string;
    };
    metrics: {
      totalDays: number;
      occupiedDays: number;
      vacantDays: number;
      occupancyRate: number;
      totalBookings: number;
      totalRevenue: number;
      averageDailyRate: number;
      revPAR: number;
    };
  }[];
  charts: {
    dailyOccupancy: { date: string; occupied: number; available: number }[];
    monthlyTrend: { month: string; occupancyRate: number }[];
  };
}

export default function OccupancyReportPage() {
  const [propertyId, setPropertyId] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Fetch properties for filter
  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  // Fetch occupancy data
  const { data, isLoading } = useQuery<OccupancyData>({
    queryKey: ['occupancy-report', propertyId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(propertyId !== 'all' && { propertyId }),
      });
      const response = await fetch(`/api/reports/occupancy?${params}`);
      if (!response.ok) throw new Error('Failed to fetch occupancy report');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Occupancy Report"
          description="Analyze property occupancy rates and performance"
        >
          <Link href="/reports/analytics">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Analytics
            </Button>
          </Link>
        </PageHeader>
        <Loading
          size="xl"
          text="Loading occupancy data..."
          submessage="Analyzing property performance"
          className="py-12"
        />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Occupancy Report"
        description="Analyze property occupancy rates and performance"
      >
        <Link href="/reports/analytics">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Analytics
          </Button>
        </Link>
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {propertiesData?.properties?.map((property: { id: string; name: string }) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Occupancy</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.overallOccupancy}%</div>
            <p className="text-muted-foreground text-xs">
              {data?.summary.totalOccupiedDays} of {data?.summary.totalAvailableDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.summary.totalRevenue || 0)}
            </div>
            <p className="text-muted-foreground text-xs">From {data?.summary.daysInRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalProperties}</div>
            <p className="text-muted-foreground text-xs">In this report</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacant Days</CardTitle>
            <TrendingDown className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.summary.totalAvailableDays || 0) - (data?.summary.totalOccupiedDays || 0)}
            </div>
            <p className="text-muted-foreground text-xs">Available for booking</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Occupancy Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.charts.monthlyTrend && data.charts.monthlyTrend.length > 0 ? (
            <div className="space-y-2">
              {data.charts.monthlyTrend.map((item) => (
                <div key={item.month} className="flex items-center gap-2">
                  <div className="w-20 text-sm text-gray-500">
                    {new Date(item.month + '-01').toLocaleDateString('en-ZA', {
                      month: 'short',
                      year: '2-digit',
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="h-6 w-full rounded bg-gray-100">
                      <div
                        className={`h-6 rounded ${
                          item.occupancyRate >= 70
                            ? 'bg-green-500'
                            : item.occupancyRate >= 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${item.occupancyRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium">{item.occupancyRate}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Property Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Occupancy by Property</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.byProperty && data.byProperty.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Occupancy</TableHead>
                    <TableHead className="text-right">Occupied</TableHead>
                    <TableHead className="text-right">Vacant</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">ADR</TableHead>
                    <TableHead className="text-right">RevPAR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byProperty.map((item) => (
                    <TableRow key={item.property.id}>
                      <TableCell>
                        <Link
                          href={`/properties/${item.property.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {item.property.name}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {item.property.rentalType.replace('_', ' ')}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${
                            item.metrics.occupancyRate >= 70
                              ? 'text-green-600'
                              : item.metrics.occupancyRate >= 40
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {item.metrics.occupancyRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{item.metrics.occupiedDays} days</TableCell>
                      <TableCell className="text-right">{item.metrics.vacantDays} days</TableCell>
                      <TableCell className="text-right">{item.metrics.totalBookings}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.metrics.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.metrics.averageDailyRate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.metrics.revPAR)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No property data available</p>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="font-medium">Metrics Guide:</span>
            <div>
              <span className="font-medium">ADR</span> = Average Daily Rate
            </div>
            <div>
              <span className="font-medium">RevPAR</span> = Revenue per Available Room
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
