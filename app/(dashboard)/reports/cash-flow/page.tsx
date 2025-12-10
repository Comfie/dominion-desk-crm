'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Download,
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

interface CashFlowData {
  summary: {
    totalInflows: number;
    totalOutflows: number;
    netCashFlow: number;
    avgMonthlyInflow: number;
    avgMonthlyOutflow: number;
    avgMonthlyNetFlow: number;
    positiveMonths: number;
    negativeMonths: number;
  };
  monthlyData: Array<{
    month: string;
    monthIndex: number;
    inflows: number;
    outflows: number;
    netCashFlow: number;
    runningBalance: number;
  }>;
  inflowsByType: Array<{ type: string; amount: number }>;
  outflowsByCategory: Array<{ category: string; amount: number }>;
  byProperty: Array<{
    property: { id: string; name: string };
    inflows: number;
    outflows: number;
    netCashFlow: number;
  }>;
  year: number;
}

const paymentTypeLabels: Record<string, string> = {
  RENT: 'Rent',
  DEPOSIT: 'Deposit',
  BOOKING: 'Booking',
  CLEANING_FEE: 'Cleaning Fee',
  UTILITIES: 'Utilities',
  LATE_FEE: 'Late Fee',
  DAMAGE: 'Damage',
  OTHER: 'Other',
};

const categoryLabels: Record<string, string> = {
  MAINTENANCE: 'Maintenance',
  UTILITIES: 'Utilities',
  INSURANCE: 'Insurance',
  PROPERTY_TAX: 'Property Tax',
  MORTGAGE: 'Mortgage',
  CLEANING: 'Cleaning',
  SUPPLIES: 'Supplies',
  ADVERTISING: 'Advertising',
  PROFESSIONAL_FEES: 'Professional Fees',
  MANAGEMENT_FEE: 'Management Fee',
  OTHER: 'Other',
};

export default function CashFlowReportPage() {
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
      return response.json();
    },
  });

  // Fetch report data
  const { data, isLoading } = useQuery<CashFlowData>({
    queryKey: ['cash-flow-report', year, propertyId],
    queryFn: async () => {
      const params = new URLSearchParams({ year });
      if (propertyId !== 'all') params.append('propertyId', propertyId);

      const response = await fetch(`/api/reports/cash-flow?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      return response.json();
    },
  });

  // Get max values for chart scaling
  const maxFlow = Math.max(
    ...(data?.monthlyData.map((m) => Math.max(m.inflows, m.outflows)) || [1])
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Cash Flow Statement"
          description="Track cash inflows and outflows over time"
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
          text="Loading cash flow data..."
          submessage="Calculating inflows and outflows"
          className="py-12"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Flow Statement"
        description="Track cash inflows and outflows over time"
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Inflows</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data?.summary.totalInflows || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              Avg: {formatCurrency(data?.summary.avgMonthlyInflow || 0)}/month
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Outflows</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data?.summary.totalOutflows || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              Avg: {formatCurrency(data?.summary.avgMonthlyOutflow || 0)}/month
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            (data?.summary.netCashFlow || 0) >= 0
              ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
              : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            {(data?.summary.netCashFlow || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (data?.summary.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data?.summary.netCashFlow || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data?.summary.positiveMonths || 0} positive, {data?.summary.negativeMonths || 0}{' '}
              negative months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Cash Flow Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow</CardTitle>
          <CardDescription>Inflows, outflows, and running balance by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Inflows</TableHead>
                  <TableHead className="text-right">Outflows</TableHead>
                  <TableHead className="text-right">Net Flow</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                  <TableHead className="w-48">Flow</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.monthlyData.map((month) => (
                  <TableRow key={month.monthIndex}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(month.inflows)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(month.outflows)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        month.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(month.netCashFlow)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        month.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(month.runningBalance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex h-4 gap-1">
                        <div
                          className="rounded bg-green-500"
                          style={{
                            width: `${maxFlow > 0 ? (month.inflows / maxFlow) * 50 : 0}%`,
                          }}
                        />
                        <div
                          className="rounded bg-red-500"
                          style={{
                            width: `${maxFlow > 0 ? (month.outflows / maxFlow) * 50 : 0}%`,
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Inflows by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
              Inflows by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.inflowsByType && data.inflowsByType.length > 0 ? (
              <div className="space-y-3">
                {data.inflowsByType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-sm">{paymentTypeLabels[item.type] || item.type}</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">No inflow data</p>
            )}
          </CardContent>
        </Card>

        {/* Outflows by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
              Outflows by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.outflowsByCategory && data.outflowsByCategory.length > 0 ? (
              <div className="space-y-3">
                {data.outflowsByCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="text-sm">
                      {categoryLabels[item.category] || item.category}
                    </span>
                    <span className="font-medium text-red-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">No outflow data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By Property */}
      {data?.byProperty && data.byProperty.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cash Flow by Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Inflows</TableHead>
                    <TableHead className="text-right">Outflows</TableHead>
                    <TableHead className="text-right">Net Cash Flow</TableHead>
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
                        {formatCurrency(item.inflows)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(item.outflows)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${
                          item.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(item.netCashFlow)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
