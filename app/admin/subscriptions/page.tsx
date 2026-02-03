'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  Search,
  Building2,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, formatCurrency } from '@/lib/utils';

interface PayFastSubscription {
  id: string;
  status: string;
  amount: number;
  merchantReference: string;
  nextBillingDate: string | null;
  lastBillingDate: string | null;
  startDate: string | null;
  cancelledAt: string | null;
}

interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  baseFee: number;
  propertyFees: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paidAt: string | null;
  createdAt: string;
}

interface Subscription {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  propertyCount: number;
  activePropertyCount: number;
  invoiceCount: number;
  mrr: number;
  nextBillingDate: string | null;
  lastBillingDate: string | null;
  payfastSubscription: PayFastSubscription | null;
  recentInvoices: BillingInvoice[];
  paymentStatus: 'CURRENT' | 'OVERDUE' | 'DUE_SOON' | 'TRIAL_EXPIRED';
  daysOverdue: number;
  daysUntilDue: number | null;
  totalRevenue: number;
  lastPayment: BillingInvoice | null;
  failedPayments: number;
  createdAt: string;
}

interface Summary {
  totalLandlords: number;
  activeSubscriptions: number;
  trialUsers: number;
  overduePayments: number;
  trialExpired: number;
  dueSoon: number;
  cancelledSubscriptions: number;
  totalMRR: number;
  totalRevenue: number;
}

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [selectedLandlord, setSelectedLandlord] = useState<Subscription | null>(null);

  const { data, isLoading, refetch } = useQuery<{
    subscriptions: Subscription[];
    summary: Summary;
  }>({
    queryKey: ['admin-subscriptions', search, statusFilter, paymentStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (paymentStatusFilter) params.set('paymentStatus', paymentStatusFilter);

      const response = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    },
  });

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </Badge>
        );
      case 'TRIAL_EXPIRED':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Trial Expired
          </Badge>
        );
      case 'DUE_SOON':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Due Soon
          </Badge>
        );
      case 'CURRENT':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Current
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      TRIAL: 'secondary',
      PAST_DUE: 'destructive',
      CANCELLED: 'outline',
      EXPIRED: 'destructive',
    };

    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const summary = data?.summary;
  const subscriptions = data?.subscriptions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground">
          Monitor landlord subscriptions, payments, and billing
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalMRR || 0)}</div>
            <p className="text-muted-foreground text-xs">
              {summary?.activeSubscriptions} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</div>
            <p className="text-muted-foreground text-xs">All-time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <AlertTriangle className="text-destructive h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.overduePayments || 0}</div>
            <p className="text-muted-foreground text-xs">
              {summary?.trialExpired || 0} trial expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.dueSoon || 0}</div>
            <p className="text-muted-foreground text-xs">Within 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Landlord Subscriptions
          </CardTitle>
          <CardDescription>View and manage all landlord subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter || 'ALL'}
              onValueChange={(value) => setStatusFilter(value === 'ALL' ? '' : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subscription Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="PAST_DUE">Past Due</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={paymentStatusFilter || 'ALL'}
              onValueChange={(value) => setPaymentStatusFilter(value === 'ALL' ? '' : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="TRIAL_EXPIRED">Trial Expired</SelectItem>
                <SelectItem value="DUE_SOON">Due Soon</SelectItem>
                <SelectItem value="CURRENT">Current</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => refetch()} variant="outline" size="icon">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Subscriptions Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Landlord</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center">
                    <p className="text-muted-foreground">No landlords found</p>
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {sub.firstName} {sub.lastName}
                        </p>
                        {sub.companyName && (
                          <p className="text-muted-foreground text-xs">{sub.companyName}</p>
                        )}
                        <p className="text-muted-foreground text-xs">{sub.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSubscriptionStatusBadge(sub.subscriptionStatus)}
                      {sub.daysOverdue > 0 && (
                        <p className="text-destructive mt-1 text-xs">
                          {sub.daysOverdue} days overdue
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(sub.paymentStatus)}
                      {sub.failedPayments > 0 && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {sub.failedPayments} failed
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{sub.propertyCount} total</p>
                        <p className="text-muted-foreground text-xs">
                          {sub.activePropertyCount} active
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sub.mrr)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(sub.totalRevenue)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {sub.nextBillingDate ? (
                          <>
                            <p>{formatDate(sub.nextBillingDate)}</p>
                            {sub.daysUntilDue !== null && (
                              <p className="text-muted-foreground text-xs">
                                in {sub.daysUntilDue} days
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">No billing date</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLandlord(sub)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Landlord Details Dialog */}
      {selectedLandlord && (
        <Dialog open={!!selectedLandlord} onOpenChange={() => setSelectedLandlord(null)}>
          <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLandlord.firstName} {selectedLandlord.lastName}
              </DialogTitle>
              <DialogDescription>
                {selectedLandlord.email}
                {selectedLandlord.companyName && ` • ${selectedLandlord.companyName}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Subscription Info */}
              <div>
                <h4 className="mb-3 font-semibold">Subscription Details</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-sm">Status</p>
                    <div className="font-medium">
                      {getSubscriptionStatusBadge(selectedLandlord.subscriptionStatus)}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Payment Status</p>
                    <div className="font-medium">
                      {getPaymentStatusBadge(selectedLandlord.paymentStatus)}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Monthly Revenue</p>
                    <p className="font-medium">{formatCurrency(selectedLandlord.mrr)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Total Revenue</p>
                    <p className="font-medium">{formatCurrency(selectedLandlord.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Properties</p>
                    <p className="font-medium">
                      {selectedLandlord.propertyCount} ({selectedLandlord.activePropertyCount}{' '}
                      active)
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Member Since</p>
                    <p className="font-medium">{formatDate(selectedLandlord.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* PayFast Subscription */}
              {selectedLandlord.payfastSubscription && (
                <div>
                  <h4 className="mb-3 font-semibold">PayFast Details</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground text-sm">Merchant Reference</p>
                      <p className="font-mono text-xs">
                        {selectedLandlord.payfastSubscription.merchantReference}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Amount</p>
                      <p className="font-medium">
                        {formatCurrency(selectedLandlord.payfastSubscription.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Next Billing</p>
                      <p className="font-medium">
                        {selectedLandlord.payfastSubscription.nextBillingDate
                          ? formatDate(selectedLandlord.payfastSubscription.nextBillingDate)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Last Billing</p>
                      <p className="font-medium">
                        {selectedLandlord.payfastSubscription.lastBillingDate
                          ? formatDate(selectedLandlord.payfastSubscription.lastBillingDate)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History */}
              <div>
                <h4 className="mb-3 font-semibold">Recent Invoices</h4>
                {selectedLandlord.recentInvoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedLandlord.recentInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-xs">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(invoice.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invoice.status === 'PAID'
                                  ? 'default'
                                  : invoice.status === 'PENDING'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {invoice.paidAt
                              ? formatDate(invoice.paidAt)
                              : formatDate(invoice.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground py-4 text-center">No invoices yet</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
