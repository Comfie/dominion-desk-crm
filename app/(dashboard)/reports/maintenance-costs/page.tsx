'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Wrench,
  DollarSign,
  Clock,
  Building2,
  Download,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { PageHeader, Loading } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface MaintenanceCostsData {
  summary: {
    totalRequests: number;
    totalCost: number;
    avgCostPerRequest: number;
    avgResolutionDays: number | null;
    completedRequests: number;
    pendingRequests: number;
    inProgressRequests: number;
  };
  byProperty: Array<{
    property: { id: string; name: string };
    requestCount: number;
    totalCost: number;
    avgCost: number;
    completedCount: number;
  }>;
  byCategory: Array<{
    category: string;
    requestCount: number;
    totalCost: number;
    avgCost: number;
  }>;
  monthlyData: Array<{
    month: string;
    cost: number;
    count: number;
  }>;
  year: number;
}

const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  STRUCTURAL: 'Structural',
  PAINTING: 'Painting',
  CLEANING: 'Cleaning',
  LANDSCAPING: 'Landscaping',
  PEST_CONTROL: 'Pest Control',
  SECURITY: 'Security',
  OTHER: 'Other',
};

export default function MaintenanceCostsReportPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [propertyId, setPropertyId] = useState<string>('all');

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Fetch properties for filter
  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch report data
  const { data, isLoading } = useQuery<MaintenanceCostsData>({
    queryKey: ['maintenance-costs-report', year, propertyId],
    queryFn: async () => {
      const params = new URLSearchParams({ year });
      if (propertyId !== 'all') params.append('propertyId', propertyId);

      const response = await fetch(`/api/reports/maintenance-costs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      return response.json();
    },
  });

  // Get max monthly cost for chart scaling
  const maxMonthlyCost = Math.max(...(data?.monthlyData.map((m) => m.cost) || [1]));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Maintenance Costs Report"
          description="Analyze maintenance expenses by property and category"
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
          text="Loading maintenance data..."
          submessage="Analyzing costs and resolution times"
          className="py-12"
        />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Costs Report"
        description="Analyze maintenance expenses by property and category"
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
              <label className="text-sm font-medium">Year</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Property</label>
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
            <div />
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
            <CardTitle className="text-sm font-medium">Total Maintenance Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrency(data?.summary.totalCost || 0)}</div>
            <p className="text-muted-foreground text-xs">
              {data?.summary.totalRequests || 0} requests in {year}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost Per Request</CardTitle>
            <Wrench className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatCurrency(data?.summary.avgCostPerRequest || 0)}
            </div>
            <p className="text-muted-foreground text-xs">Per maintenance request</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data?.summary.avgResolutionDays !== null &&
              data?.summary.avgResolutionDays !== undefined
                ? `${data.summary.avgResolutionDays} days`
                : '—'}
            </div>
            <p className="text-muted-foreground text-xs">From request to completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data?.summary.totalRequests
                ? Math.round((data.summary.completedRequests / data.summary.totalRequests) * 100)
                : 0}
              %
            </div>
            <p className="text-muted-foreground text-xs">
              {data?.summary.completedRequests || 0} completed, {data?.summary.pendingRequests || 0}{' '}
              pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Maintenance Costs</CardTitle>
          <CardDescription>Cost trend throughout {year}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.monthlyData.map((month) => (
              <div key={month.month} className="flex items-center gap-2">
                <div className="w-12 text-sm text-gray-500">{month.month}</div>
                <div className="flex-1">
                  <div className="h-6 w-full rounded bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-6 rounded bg-red-500"
                      style={{
                        width: `${maxMonthlyCost > 0 ? (month.cost / maxMonthlyCost) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right text-sm font-medium">
                  {formatCurrency(month.cost)}
                </div>
                <div className="text-muted-foreground w-16 text-right text-xs">
                  {month.count} req
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* By Property */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Costs by Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byProperty && data.byProperty.length > 0 ? (
              <div className="space-y-4">
                {data.byProperty.map((item) => (
                  <div key={item.property.id} className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/properties/${item.property.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {item.property.name}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {item.requestCount} requests • Avg: {formatCurrency(item.avgCost)}
                      </p>
                    </div>
                    <span className="font-bold">{formatCurrency(item.totalCost)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">No property data</p>
            )}
          </CardContent>
        </Card>

        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Costs by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byCategory && data.byCategory.length > 0 ? (
              <div className="space-y-4">
                {data.byCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {categoryLabels[item.category] || item.category}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {item.requestCount} requests • Avg: {formatCurrency(item.avgCost)}
                      </p>
                    </div>
                    <span className="font-bold">{formatCurrency(item.totalCost)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">No category data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
