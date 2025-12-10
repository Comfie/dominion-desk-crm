'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  Clock,
  Mail,
  Download,
  Building2,
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
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface AgingReceivablesData {
  payments: Array<{
    id: string;
    paymentReference: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
    agingBucket: string;
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    } | null;
    property: {
      id: string;
      name: string;
    } | null;
  }>;
  tenantBreakdown: Array<{
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    property: { id: string; name: string } | null;
    total: number;
    current: number;
    '1-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  }>;
  propertyBreakdown: Array<{
    property: { id: string; name: string };
    total: number;
    current: number;
    '1-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  }>;
  summary: {
    totalOutstanding: number;
    paymentCount: number;
    current: number;
    '1-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
    currentCount: number;
    '1-30Count': number;
    '31-60Count': number;
    '61-90Count': number;
    '90+Count': number;
  };
}

export default function AgingReceivablesReportPage() {
  const [propertyId, setPropertyId] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  const { data, isLoading } = useQuery<AgingReceivablesData>({
    queryKey: ['aging-receivables-report', propertyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId !== 'all') params.append('propertyId', propertyId);

      const response = await fetch(`/api/reports/aging-receivables?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      return response.json();
    },
  });

  // Send reminder mutation
  const sendReminder = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(`/api/payments/${paymentId}/send-reminder`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reminder');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reminder sent',
        description: 'Payment reminder has been sent to the tenant.',
      });
      queryClient.invalidateQueries({ queryKey: ['aging-receivables-report'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send reminder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate bucket percentages for visualization
  const getPercentage = (amount: number) => {
    if (!data?.summary.totalOutstanding || data.summary.totalOutstanding === 0) return 0;
    return (amount / data.summary.totalOutstanding) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Aging Receivables"
          description="Track outstanding payments by aging bucket"
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
          text="Loading receivables data..."
          submessage="Analyzing outstanding payments"
          className="py-12"
        />
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aging Receivables"
        description="Track outstanding payments by aging bucket"
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

      {/* Total Outstanding */}
      <Card className="border-2 border-red-200 dark:border-red-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">Total Outstanding</CardTitle>
          <DollarSign className="h-6 w-6 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-red-600">
            {formatCurrency(data?.summary.totalOutstanding || 0)}
          </div>
          <p className="text-muted-foreground text-sm">
            {data?.summary.paymentCount || 0} outstanding payments
          </p>
        </CardContent>
      </Card>

      {/* Aging Buckets Summary */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data?.summary.current || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data?.summary.currentCount || 0} payment(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">1-30 Days</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(data?.summary['1-30'] || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data?.summary['1-30Count'] || 0} payment(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">31-60 Days</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(data?.summary['31-60'] || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data?.summary['31-60Count'] || 0} payment(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">61-90 Days</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(data?.summary['61-90'] || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data?.summary['61-90Count'] || 0} payment(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90+ Days</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(data?.summary['90+'] || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data?.summary['90+Count'] || 0} payment(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Visualization Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-8 overflow-hidden rounded-full">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${getPercentage(data?.summary.current || 0)}%` }}
              title={`Current: ${formatCurrency(data?.summary.current || 0)}`}
            />
            <div
              className="bg-yellow-500 transition-all"
              style={{ width: `${getPercentage(data?.summary['1-30'] || 0)}%` }}
              title={`1-30 Days: ${formatCurrency(data?.summary['1-30'] || 0)}`}
            />
            <div
              className="bg-orange-500 transition-all"
              style={{ width: `${getPercentage(data?.summary['31-60'] || 0)}%` }}
              title={`31-60 Days: ${formatCurrency(data?.summary['31-60'] || 0)}`}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${getPercentage(data?.summary['61-90'] || 0)}%` }}
              title={`61-90 Days: ${formatCurrency(data?.summary['61-90'] || 0)}`}
            />
            <div
              className="bg-red-700 transition-all"
              style={{ width: `${getPercentage(data?.summary['90+'] || 0)}%` }}
              title={`90+ Days: ${formatCurrency(data?.summary['90+'] || 0)}`}
            />
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              Current
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              1-30 Days
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              31-60 Days
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              61-90 Days
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-red-700" />
              90+ Days
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Breakdown */}
      {data?.tenantBreakdown && data.tenantBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Outstanding by Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">1-30</TableHead>
                    <TableHead className="text-right">31-60</TableHead>
                    <TableHead className="text-right">61-90</TableHead>
                    <TableHead className="text-right">90+</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tenantBreakdown.map((item) => (
                    <TableRow key={item.tenant.id}>
                      <TableCell>
                        <Link
                          href={`/tenants/${item.tenant.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {item.tenant.firstName} {item.tenant.lastName}
                        </Link>
                        <p className="text-muted-foreground text-xs">{item.tenant.email}</p>
                      </TableCell>
                      <TableCell>
                        {item.property ? (
                          <Link
                            href={`/properties/${item.property.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {item.property.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.current > 0 ? formatCurrency(item.current) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-yellow-600">
                        {item['1-30'] > 0 ? formatCurrency(item['1-30']) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {item['31-60'] > 0 ? formatCurrency(item['31-60']) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        {item['61-90'] > 0 ? formatCurrency(item['61-90']) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-red-700">
                        {item['90+'] > 0 ? formatCurrency(item['90+']) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(item.total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Send reminder for the oldest payment
                            const oldestPayment = data.payments.find(
                              (p) => p.tenant?.id === item.tenant.id
                            );
                            if (oldestPayment) {
                              sendReminder.mutate(oldestPayment.id);
                            }
                          }}
                          disabled={sendReminder.isPending}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property Breakdown */}
      {data?.propertyBreakdown && data.propertyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Outstanding by Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">1-30</TableHead>
                    <TableHead className="text-right">31-60</TableHead>
                    <TableHead className="text-right">61-90</TableHead>
                    <TableHead className="text-right">90+</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.propertyBreakdown.map((item) => (
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
                        {item.current > 0 ? formatCurrency(item.current) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-yellow-600">
                        {item['1-30'] > 0 ? formatCurrency(item['1-30']) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {item['31-60'] > 0 ? formatCurrency(item['31-60']) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        {item['61-90'] > 0 ? formatCurrency(item['61-90']) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-red-700">
                        {item['90+'] > 0 ? formatCurrency(item['90+']) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!data?.tenantBreakdown || data.tenantBreakdown.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-medium">No Outstanding Receivables</h3>
            <p className="text-muted-foreground mt-2">All payments are up to date. Great job!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
