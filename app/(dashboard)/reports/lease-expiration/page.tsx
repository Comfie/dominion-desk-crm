'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  Download,
  Users,
  Loader2,
} from 'lucide-react';

import { PageHeader, Loading } from '@/components/shared';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCsv, formatDateForCsv, formatCurrencyForCsv } from '@/lib/utils/export-csv';

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
    renewalWorkflow: {
      stage: string;
      label: string;
      guidance: string;
      priority: string;
    } | null;
    renewalTask: {
      id: string;
      status: string;
      priority: string;
      dueDate: string | null;
    } | null;
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
    openRenewalTasks: number;
    leasesWithoutRenewalTask: number;
  };
}

export default function LeaseExpirationReportPage() {
  const { toast } = useToast();
  const [propertyId, setPropertyId] = useState<string>('all');
  const [window, setWindow] = useState<string>('all');
  const [generatingRenewalTasks, setGeneratingRenewalTasks] = useState(false);

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
  const { data, isLoading, refetch } = useQuery<LeaseExpirationData>({
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

  const getWorkflowBadge = (priority: string, label: string) => {
    const className =
      priority === 'URGENT'
        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
        : priority === 'HIGH'
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';

    return <Badge className={className}>{label}</Badge>;
  };

  const handleGenerateRenewalTasks = async () => {
    try {
      setGeneratingRenewalTasks(true);

      const response = await fetch('/api/tasks/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: 'lease_renewal',
          propertyId,
          windowDays: window === 'all' ? 90 : Number(window),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create renewal tasks');
      }

      toast({
        title: `Created ${result.createdCount} renewal task${result.createdCount === 1 ? '' : 's'}`,
        description:
          result.skippedCount > 0
            ? `${result.skippedCount} lease${result.skippedCount === 1 ? '' : 's'} already had open tasks.`
            : 'All leases in scope now have renewal workflow tasks.',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: error.message || 'Failed to generate renewal tasks',
        variant: 'destructive',
      });
    } finally {
      setGeneratingRenewalTasks(false);
    }
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (!data?.leases?.length) return;
                  exportToCsv({
                    filename: 'lease-expiration-report.csv',
                    headers: [
                      'Property',
                      'Address',
                      'Tenant',
                      'Email',
                      'Lease Start',
                      'Lease End',
                      'Monthly Rent',
                      'Days Until Expiry',
                      'Window',
                    ],
                    rows: data.leases.map((l) => [
                      l.property.name,
                      `${l.property.address}, ${l.property.city}`,
                      `${l.tenant.firstName} ${l.tenant.lastName}`,
                      l.tenant.email,
                      formatDateForCsv(l.leaseStartDate),
                      l.leaseEndDate ? formatDateForCsv(l.leaseEndDate) : 'No end date',
                      formatCurrencyForCsv(l.monthlyRent),
                      l.daysUntilExpiry ?? '',
                      l.expiryWindow,
                    ]),
                  });
                }}
              >
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

      {data?.summary && (
        <Alert className="border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20">
          <AlertTitle>Renewal pipeline</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p>
                {data.summary.openRenewalTasks} renewal task
                {data.summary.openRenewalTasks === 1 ? '' : 's'} already open.{' '}
                {data.summary.leasesWithoutRenewalTask} lease
                {data.summary.leasesWithoutRenewalTask === 1 ? '' : 's'} still need workflow tasks.
              </p>
              <p className="text-muted-foreground text-xs">
                Create tasks here to push expiring leases into a real renewal pipeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGenerateRenewalTasks}
                disabled={generatingRenewalTasks || !data.summary.leasesWithoutRenewalTask}
              >
                {generatingRenewalTasks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Renewal Tasks
              </Button>
              <Button variant="outline" asChild>
                <Link href="/tasks?taskType=LEASE_RENEWAL">View Renewal Tasks</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                    <TableHead>Renewal Workflow</TableHead>
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
                      <TableCell>
                        <div className="space-y-1.5">
                          {lease.renewalWorkflow ? (
                            getWorkflowBadge(
                              lease.renewalWorkflow.priority,
                              lease.renewalWorkflow.label
                            )
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                          {lease.renewalTask ? (
                            <Link
                              href={`/tasks/${lease.renewalTask.id}`}
                              className="block text-xs font-medium text-blue-600 hover:underline"
                            >
                              Task in queue
                            </Link>
                          ) : (
                            <p className="text-muted-foreground text-xs">No task yet</p>
                          )}
                        </div>
                      </TableCell>
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
