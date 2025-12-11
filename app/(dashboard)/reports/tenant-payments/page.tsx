'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Download,
} from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TenantPaymentData {
  payments: Array<{
    id: string;
    paymentReference: string;
    paymentType: string;
    amount: number;
    dueDate: string;
    paymentDate: string | null;
    status: string;
    isOnTime: boolean;
    daysLate: number;
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
    property: {
      id: string;
      name: string;
    } | null;
  }>;
  tenantStats: Array<{
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    totalPayments: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    onTimeCount: number;
    lateCount: number;
    punctualityRate: number;
  }>;
  summary: {
    totalPayments: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    onTimePayments: number;
    latePayments: number;
    overallPunctualityRate: number;
  };
}

const paymentTypeLabels: Record<string, string> = {
  RENT: 'Rent',
  DEPOSIT: 'Deposit',
  BOOKING: 'Booking',
  CLEANING_FEE: 'Cleaning Fee',
  UTILITIES: 'Utilities',
  LATE_FEE: 'Late Fee',
  DAMAGE: 'Damage',
  REFUND: 'Refund',
  OTHER: 'Other',
};

export default function TenantPaymentsReportPage() {
  const [tenantId, setTenantId] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Fetch tenants for filter
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await fetch('/api/tenants');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json();
    },
  });

  // Fetch report data
  const { data, isLoading } = useQuery<TenantPaymentData>({
    queryKey: ['tenant-payments-report', tenantId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tenantId !== 'all') params.append('tenantId', tenantId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/reports/tenant-payments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      return response.json();
    },
  });

  const getStatusBadge = (status: string, isOnTime: boolean, daysLate: number) => {
    if (status === 'PAID') {
      if (isOnTime) {
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" /> Paid On Time
          </Badge>
        );
      }
      return (
        <Badge className="bg-yellow-600">
          <Clock className="mr-1 h-3 w-3" /> Paid {daysLate}d Late
        </Badge>
      );
    }
    if (status === 'OVERDUE') {
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" /> Overdue {daysLate}d
        </Badge>
      );
    }
    if (status === 'PENDING') {
      return <Badge variant="secondary">Pending</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tenant Payment History"
          description="Track payment history and punctuality by tenant"
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
          text="Loading payment data..."
          submessage="Analyzing tenant payment history"
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
        title="Tenant Payment History"
        description="Track payment history and punctuality by tenant"
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
              <Label>Tenant</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="All tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {tenantsData?.tenants?.map(
                    (tenant: { id: string; firstName: string; lastName: string }) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.firstName} {tenant.lastName}
                      </SelectItem>
                    )
                  )}
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
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(data?.summary.paidAmount || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data?.summary.onTimePayments || 0} payments received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-yellow-600">
              {formatCurrency(data?.summary.pendingAmount || 0)}
            </div>
            <p className="text-muted-foreground text-xs">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(data?.summary.overdueAmount || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data?.summary.latePayments || 0} late payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punctuality Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{data?.summary.overallPunctualityRate || 0}%</div>
            <p className="text-muted-foreground text-xs">Payments made on time</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Statistics */}
      {data?.tenantStats && data.tenantStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tenant Payment Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-right">On Time</TableHead>
                    <TableHead className="text-right">Late</TableHead>
                    <TableHead className="text-right">Punctuality</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tenantStats.map((stat) => (
                    <TableRow key={stat.tenant.id}>
                      <TableCell>
                        <Link
                          href={`/tenants/${stat.tenant.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {stat.tenant.firstName} {stat.tenant.lastName}
                        </Link>
                        <p className="text-muted-foreground text-xs">{stat.tenant.email}</p>
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(stat.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right text-yellow-600">
                        {formatCurrency(stat.pendingAmount)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(stat.overdueAmount)}
                      </TableCell>
                      <TableCell className="text-right">{stat.onTimeCount}</TableCell>
                      <TableCell className="text-right">{stat.lateCount}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            stat.punctualityRate >= 80
                              ? 'default'
                              : stat.punctualityRate >= 50
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {stat.punctualityRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.payments && data.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="text-sm">{formatDate(payment.dueDate)}</div>
                        {payment.paymentDate && (
                          <div className="text-muted-foreground text-xs">
                            Paid: {formatDate(payment.paymentDate)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.tenant ? (
                          <Link
                            href={`/tenants/${payment.tenant.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {payment.tenant.firstName} {payment.tenant.lastName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.property ? (
                          <Link
                            href={`/properties/${payment.property.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {payment.property.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {paymentTypeLabels[payment.paymentType] || payment.paymentType}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status, payment.isOnTime, payment.daysLate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-center">No payment data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
