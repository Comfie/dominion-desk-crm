'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CollectionSummaryCards } from '@/components/financials/collection-summary-cards';
import { CollectionTrendChart } from '@/components/financials/collection-trend-chart';
import { RentCollectionGrid } from '@/components/financials/rent-collection-grid';
import { QuickRecordPaymentModal } from '@/components/financials/quick-record-payment-modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, FileText, Download } from 'lucide-react';
import { PaymentStatus } from '@prisma/client';
import { exportToCsv, formatDateForCsv, formatCurrencyForCsv } from '@/lib/utils/export-csv';

export default function RentCollectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Data
  const [data, setData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);

  // Modal state
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedPropertyData, setSelectedPropertyData] = useState<any>(null);
  const [generatingFollowUpTasks, setGeneratingFollowUpTasks] = useState(false);

  // Fetch properties for filter dropdown
  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch rent collection data when filters change
  useEffect(() => {
    fetchRentCollectionData();
  }, [selectedMonth, selectedYear, selectedProperty, selectedStatus]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      if (response.ok) {
        const result = await response.json();
        setProperties(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchRentCollectionData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear,
        propertyId: selectedProperty,
        status: selectedStatus,
      });

      const response = await fetch(`/api/rent-collection?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to fetch rent collection data'
        );
      }

      const result = await response.json();
      setData(result);
    } catch (error: any) {
      console.error('Error fetching rent collection data:', error);
      toast({
        title: error.message || 'Failed to load rent collection data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRecordPayment = (payment: any, tenant: any, property: any) => {
    setSelectedPayment(payment);
    setSelectedTenant(tenant);
    setSelectedPropertyData(property);
    setRecordPaymentModalOpen(true);
  };

  const handleSendReminder = async (payment: any, tenant: any) => {
    try {
      const response = await fetch(`/api/payments/${payment.id}/send-reminder`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || error.message || 'Failed to send reminder');
      }

      toast({ title: `Reminder sent to ${tenant.firstName} ${tenant.lastName}` });
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast({ title: error.message || 'Failed to send reminder', variant: 'destructive' });
    }
  };

  const handleVerifyProof = (payment: any) => {
    router.push(`/financials/payments/${payment.id}`);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRentCollectionData();
  };

  const handleGenerateFollowUpTasks = async () => {
    try {
      setGeneratingFollowUpTasks(true);

      const response = await fetch('/api/tasks/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: 'arrears_follow_up',
          month: Number(selectedMonth),
          year: Number(selectedYear),
          propertyId: selectedProperty,
          includePendingVerification: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create arrears follow-up tasks');
      }

      toast({
        title: `Created ${result.createdCount} follow-up task${result.createdCount === 1 ? '' : 's'}`,
        description:
          result.skippedCount > 0
            ? `${result.skippedCount} payment${result.skippedCount === 1 ? '' : 's'} already had open tasks.`
            : 'All current arrears cases now have workflow tasks.',
      });

      fetchRentCollectionData();
    } catch (error: any) {
      console.error('Error generating follow-up tasks:', error);
      toast({
        title: error.message || 'Failed to generate follow-up tasks',
        variant: 'destructive',
      });
    } finally {
      setGeneratingFollowUpTasks(false);
    }
  };

  const handleExportCSV = () => {
    if (!data?.properties) return;

    const rows: (string | number)[][] = [];
    for (const prop of data.properties) {
      for (const t of prop.tenants) {
        rows.push([
          prop.property.name,
          `${t.tenant.firstName} ${t.tenant.lastName}`,
          t.unitLabel || '',
          t.monthlyRent,
          t.payment?.status || 'PENDING',
          t.payment?.paymentDate ? formatDateForCsv(t.payment.paymentDate) : '',
          t.payment?.paymentMethod || '',
        ]);
      }
    }

    exportToCsv({
      filename: `rent-collection-${selectedYear}-${selectedMonth}.csv`,
      headers: ['Property', 'Tenant', 'Unit', 'Monthly Rent', 'Status', 'Payment Date', 'Method'],
      rows,
    });

    toast({ title: 'CSV exported successfully' });
  };

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = now.getFullYear() - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: PaymentStatus.PAID, label: 'Paid' },
    { value: PaymentStatus.PENDING, label: 'Pending' },
    { value: PaymentStatus.OVERDUE, label: 'Overdue' },
    { value: PaymentStatus.PENDING_VERIFICATION, label: 'Pending Verification' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Rent Collection</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Monitor payment status across your entire portfolio
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            size="sm"
            className="sm:size-default"
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={loading || !data}
            size="sm"
            className="sm:size-default"
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            onClick={() => router.push('/financials/invoices/new')}
            size="sm"
            className="sm:size-default"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Create Invoice</span>
            <span className="sm:hidden">Invoice</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Property</label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && !data ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <CollectionSummaryCards summary={data.summary} />

          {(data.summary.overdueCount > 0 || data.summary.pendingVerificationCount > 0) && (
            <Alert className="border-yellow-200 bg-yellow-50/60 dark:border-yellow-900 dark:bg-yellow-950/20">
              <AlertTitle>Arrears workflow queue</AlertTitle>
              <AlertDescription className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <p>
                    {data.summary.overdueCount} overdue payment
                    {data.summary.overdueCount === 1 ? '' : 's'} and{' '}
                    {data.summary.pendingVerificationCount} proof-review case
                    {data.summary.pendingVerificationCount === 1 ? '' : 's'} need follow-up.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Open follow-up tasks: {data.summary.openFollowUpTasks || 0}. Missing tasks:{' '}
                    {data.summary.paymentsWithoutFollowUpTask || 0}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleGenerateFollowUpTasks}
                    disabled={generatingFollowUpTasks || !data.summary.paymentsWithoutFollowUpTask}
                  >
                    {generatingFollowUpTasks ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Create Follow-Up Tasks
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/tasks?taskType=PAYMENT_REMINDER')}
                  >
                    View Task Queue
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Rent Roll Grid */}
          <RentCollectionGrid
            data={data.properties}
            onRecordPayment={handleRecordPayment}
            onSendReminder={handleSendReminder}
            onVerifyProof={handleVerifyProof}
          />

          {/* Collection Trend Chart */}
          <CollectionTrendChart data={data.monthlyTrend} />
        </>
      ) : null}

      {/* Quick Record Payment Modal */}
      {selectedPayment && selectedTenant && selectedPropertyData && (
        <QuickRecordPaymentModal
          open={recordPaymentModalOpen}
          onOpenChange={setRecordPaymentModalOpen}
          payment={selectedPayment}
          tenant={selectedTenant}
          property={selectedPropertyData}
          onSuccess={() => {
            fetchRentCollectionData();
          }}
        />
      )}
    </div>
  );
}
