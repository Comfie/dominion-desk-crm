'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Download,
  Users,
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
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface LeaseExpirationData {
  leases: Array<{
    id: string;
    leaseStartDate: string;
    leaseEndDate: string | null;
    monthlyRent: number;
    depositPaid: number;
    daysUntilExpiry: number | null;
    expiryWindow: string;
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      status: string;
    };
    property: {
      id: string;
      name: string;
      address: string;
      city: string;
    };
  }>;
  byWindow: {
    '0-30': { count: number; rentAtRisk: number };
    '31-60': { count: number; rentAtRisk: number };
    '61-90': { count: number; rentAtRisk: number };
    '90+': { count: number; rentAtRisk: number };
  };
  expiredLeases: Array<{
    id: string;
    tenant: { id: string; firstName: string; lastName: string };
    property: { id: string; name: string };
    monthlyRent: number;
  }>;
  summary: {
    totalActiveLeases: number;
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
    expiredLeases: number;
    totalMonthlyRent: number;
    atRiskRent: number;
  };
}

export default function LeaseExpirationReportPage() {
  const [propertyId, setPropertyId] = useState<string>('all');
  const [window, setWindow] = useState<string>('all');

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
  const { data, isLoading } = useQuery<LeaseExpirationData>({
    queryKey: ['lease-expiration-report', propertyId, window],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId !== 'all') params.append('propertyId', propertyId);
      if (window !== 'all') params.append('window', window);

      const response = await fetch(`/api/reports/lease-expiration?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      return response.json();
    },
  });

  const getUrgencyBadge = (daysUntilExpiry: number | null) => {
    if (daysUntilExpiry === null) {
      return <Badge variant="outline">No End Date</Badge>;
    }
    if (daysUntilExpiry <= 30) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {daysUntilExpiry} days
        </Badge>
      );
    }
    if (daysUntilExpiry <= 60) {
      return (
        <Badge className="bg-yellow-600">
          <Clock className="mr-1 h-3 w-3" />
          {daysUntilExpiry} days
        </Badge>
      );
    }
    if (daysUntilExpiry <= 90) {
      return (
        <Badge className="bg-blue-600">
          <Calendar className="mr-1 h-3 w-3" />
          {daysUntilExpiry} days
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <CheckCircle className="mr-1 h-3 w-3" />
        {daysUntilExpiry} days
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Lease Expiration Report"
          description="Track upcoming lease renewals and expirations"
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
          text="Loading lease data..."
          submessage="Analyzing lease expirations"
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
        title="Lease Expiration Report"
        description="Track upcoming lease renewals and expirations"
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiration Window</label>
              <Select value={window} onValueChange={setWindow}>
                <SelectTrigger>
                  <SelectValue placeholder="All leases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leases</SelectItem>
                  <SelectItem value="30">Expiring in 30 days</SelectItem>
                  <SelectItem value="60">Expiring in 60 days</SelectItem>
                  <SelectItem value="90">Expiring in 90 days</SelectItem>
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
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring in 30 Days</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">
              {data?.byWindow['0-30'].count || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              {formatCurrency(data?.byWindow['0-30'].rentAtRisk || 0)} at risk
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">31-60 Days</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-yellow-600">
              {data?.byWindow['31-60'].count || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              {formatCurrency(data?.byWindow['31-60'].rentAtRisk || 0)} rent
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">61-90 Days</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {data?.byWindow['61-90'].count || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              {formatCurrency(data?.byWindow['61-90'].rentAtRisk || 0)} rent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90+ Days</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{data?.byWindow['90+'].count || 0}</div>
            <p className="text-muted-foreground text-xs">
              {formatCurrency(data?.byWindow['90+'].rentAtRisk || 0)} rent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for expired leases */}
      {data?.expiredLeases && data.expiredLeases.length > 0 && (
        <Card className="border-red-300 bg-red-100 dark:border-red-800 dark:bg-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Expired Leases Requiring Attention
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              {data.expiredLeases.length} lease(s) have already expired but are still marked as
              active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.expiredLeases.slice(0, 5).map((lease) => (
                <div
                  key={lease.id}
                  className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-red-950"
                >
                  <div>
                    <Link
                      href={`/tenants/${lease.tenant.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {lease.tenant.firstName} {lease.tenant.lastName}
                    </Link>
                    <span className="text-muted-foreground mx-2">at</span>
                    <Link
                      href={`/properties/${lease.property.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {lease.property.name}
                    </Link>
                  </div>
                  <span className="font-medium">{formatCurrency(lease.monthlyRent)}/mo</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lease Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Upcoming Lease Expirations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.leases && data.leases.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Lease Start</TableHead>
                    <TableHead>Lease End</TableHead>
                    <TableHead className="text-right">Monthly Rent</TableHead>
                    <TableHead>Time Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leases.map((lease) => (
                    <TableRow key={lease.id}>
                      <TableCell>
                        <Link
                          href={`/properties/${lease.property.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {lease.property.name}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {lease.property.address}, {lease.property.city}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/tenants/${lease.tenant.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {lease.tenant.firstName} {lease.tenant.lastName}
                        </Link>
                        <p className="text-muted-foreground text-xs">{lease.tenant.email}</p>
                      </TableCell>
                      <TableCell>{formatDate(lease.leaseStartDate)}</TableCell>
                      <TableCell>
                        {lease.leaseEndDate ? formatDate(lease.leaseEndDate) : 'No end date'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(lease.monthlyRent)}
                      </TableCell>
                      <TableCell>{getUrgencyBadge(lease.daysUntilExpiry)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No upcoming lease expirations found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Active Leases:</span>{' '}
              <span className="font-medium">{data?.summary.totalActiveLeases || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Monthly Rent:</span>{' '}
              <span className="font-medium">
                {formatCurrency(data?.summary.totalMonthlyRent || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Rent at Risk (30 days):</span>{' '}
              <span className="font-medium text-red-600">
                {formatCurrency(data?.summary.atRiskRent || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
