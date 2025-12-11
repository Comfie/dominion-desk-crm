'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  PieChart,
  BarChart3,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface RevenueData {
  summary: {
    year: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    profitMargin: number;
    averageMonthlyRevenue: number;
    averageMonthlyExpenses: number;
    yoyGrowth: number;
    previousYearRevenue: number;
  };
  byMonth: {
    month: string;
    revenue: number;
    expenses: number;
    netIncome: number;
  }[];
  byProperty: {
    property: { id: string; name: string };
    revenue: number;
    expenses: number;
    netIncome: number;
    profitMargin: number;
  }[];
  byPaymentType: { type: string; amount: number }[];
  bySource: { source: string; amount: number }[];
  expensesByCategory: { category: string; amount: number }[];
  topProperties: {
    property: { id: string; name: string };
    revenue: number;
    expenses: number;
    netIncome: number;
    profitMargin: number;
  }[];
}

export default function RevenueReportPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [propertyId, setPropertyId] = useState<string>('all');

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

  // Fetch revenue data
  const { data, isLoading } = useQuery<RevenueData>({
    queryKey: ['revenue-report', year, propertyId],
    queryFn: async () => {
      const params = new URLSearchParams({
        year,
        ...(propertyId !== 'all' && { propertyId }),
      });
      const response = await fetch(`/api/reports/revenue?${params}`);
      if (!response.ok) throw new Error('Failed to fetch revenue report');
      return response.json();
    },
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Revenue Report"
          description="Analyze income, expenses, and profitability"
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
          text="Loading revenue data..."
          submessage="Calculating financial metrics"
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
      <PageHeader title="Revenue Report" description="Analyze income, expenses, and profitability">
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
                  <SelectValue placeholder="Select year" />
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatCurrency(data?.summary.totalRevenue || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              Avg {formatCurrency(data?.summary.averageMonthlyRevenue || 0)}/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(data?.summary.totalExpenses || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              Avg {formatCurrency(data?.summary.averageMonthlyExpenses || 0)}/month
            </p>
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
              className={`text-lg font-bold ${
                (data?.summary.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data?.summary.netIncome || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data?.summary.profitMargin.toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YoY Growth</CardTitle>
            {(data?.summary.yoyGrowth || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-lg font-bold ${
                (data?.summary.yoyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {(data?.summary.yoyGrowth || 0) >= 0 ? '+' : ''}
              {data?.summary.yoyGrowth}%
            </div>
            <p className="text-muted-foreground text-xs">
              vs {formatCurrency(data?.summary.previousYearRevenue || 0)} last year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.byMonth && data.byMonth.length > 0 ? (
            <div className="space-y-3">
              {data.byMonth.map((item) => (
                <div key={item.month} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>
                      {new Date(item.month + '-01').toLocaleDateString('en-ZA', {
                        month: 'long',
                      })}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-green-600">+{formatCurrency(item.revenue)}</span>
                      <span className="text-red-600">-{formatCurrency(item.expenses)}</span>
                      <span
                        className={`font-medium ${
                          item.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        = {formatCurrency(item.netIncome)}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-4 gap-1">
                    <div
                      className="h-full rounded bg-green-500"
                      style={{
                        width: `${
                          (item.revenue /
                            Math.max(
                              ...data.byMonth.map((m) => Math.max(m.revenue, m.expenses)),
                              1
                            )) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="h-full rounded bg-red-400"
                      style={{
                        width: `${
                          (item.expenses /
                            Math.max(
                              ...data.byMonth.map((m) => Math.max(m.revenue, m.expenses)),
                              1
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout for Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.bySource && data.bySource.length > 0 ? (
              <div className="space-y-3">
                {data.bySource.map((item) => {
                  const total = data.bySource.reduce((sum, s) => sum + s.amount, 0);
                  const percentage = total > 0 ? (item.amount / total) * 100 : 0;

                  return (
                    <div key={item.source} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.source.replace('_', ' ')}</span>
                        <span className="font-medium">
                          {formatCurrency(item.amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.expensesByCategory && data.expensesByCategory.length > 0 ? (
              <div className="space-y-3">
                {data.expensesByCategory.map((item) => {
                  const total = data.expensesByCategory.reduce((sum, e) => sum + e.amount, 0);
                  const percentage = total > 0 ? (item.amount / total) * 100 : 0;

                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.category.replace('_', ' ')}</span>
                        <span className="font-medium">
                          {formatCurrency(item.amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-red-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Property Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Property</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.byProperty && data.byProperty.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net Income</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
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
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(item.expenses)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          item.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(item.netIncome)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            item.profitMargin >= 50
                              ? 'default'
                              : item.profitMargin >= 20
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {item.profitMargin.toFixed(1)}%
                        </Badge>
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

      {/* Top Properties */}
      {data?.topProperties && data.topProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.topProperties.slice(0, 3).map((item, index) => (
                <Card key={item.property.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          #{index + 1}
                        </Badge>
                        <Link
                          href={`/properties/${item.property.id}`}
                          className="block font-medium text-blue-600 hover:underline"
                        >
                          {item.property.name}
                        </Link>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Net Income</span>
                        <span className="font-medium">{formatCurrency(item.netIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Margin</span>
                        <span className="font-medium">{item.profitMargin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
