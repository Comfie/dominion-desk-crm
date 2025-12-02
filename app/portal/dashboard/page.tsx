'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Wrench,
  DollarSign,
  FileText,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  Loader2,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TenantPortalData {
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    property: {
      id: string;
      name: string;
      address: string;
      city: string;
    } | null;
    leaseStart: string | null;
    leaseEnd: string | null;
    rentAmount: number | null;
    nextPaymentDue: string | null;
  };
  maintenanceRequests: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    status: string;
  }>;
}

export default function TenantDashboardPage() {
  const queryClient = useQueryClient();
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery<TenantPortalData>({
    queryKey: ['tenant-portal'],
    queryFn: async () => {
      const response = await fetch('/api/portal/dashboard');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch data');
      }
      return response.json();
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/portal/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          category: formData.get('category'),
          priority: formData.get('priority'),
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit request');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-portal'] });
      setMaintenanceDialogOpen(false);
    },
  });

  const handleMaintenanceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    maintenanceMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">Unable to Load Dashboard</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'No tenant record found for this account'}
            </p>
            <Button onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { tenant, maintenanceRequests, recentPayments } = data;

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-gradient-header border-b border-white/10 shadow-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-4">
          <Link href="/portal/dashboard" className="flex items-center gap-2 text-white">
            <Building2 className="h-6 w-6 flex-shrink-0" />
            <span className="hidden text-lg font-semibold sm:inline">Tenant Portal</span>
            <span className="text-lg font-semibold sm:hidden">Portal</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden max-w-[150px] truncate text-sm text-white/80 md:inline">
              {tenant.firstName} {tenant.lastName}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Welcome, {tenant.firstName}!</h1>

        {/* Property Info */}
        {tenant.property && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Your Rental Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-lg font-semibold">{tenant.property.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {tenant.property.address}, {tenant.property.city}
                  </p>
                </div>
                <div className="text-sm">
                  {tenant.leaseStart && tenant.leaseEnd && (
                    <p className="mb-1">
                      <span className="text-muted-foreground">Lease: </span>
                      {formatDate(tenant.leaseStart)} - {formatDate(tenant.leaseEnd)}
                    </p>
                  )}
                  {tenant.rentAmount && (
                    <p className="mb-1">
                      <span className="text-muted-foreground">Rent: </span>
                      <span className="font-semibold">
                        {formatCurrency(Number(tenant.rentAmount))}/month
                      </span>
                    </p>
                  )}
                  {tenant.nextPaymentDue && (
                    <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-yellow-600" />
                        <div>
                          <p className="text-xs font-medium text-yellow-800">Next Payment Due</p>
                          <p className="text-xs font-semibold text-yellow-700">
                            {formatDate(tenant.nextPaymentDue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Maintenance Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Maintenance</span>
                  </CardTitle>
                  <CardDescription className="mt-1">Your maintenance requests</CardDescription>
                </div>
                <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex-shrink-0">
                      <Plus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">New</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Maintenance Request</DialogTitle>
                      <DialogDescription>
                        Describe the issue and we'll address it as soon as possible
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Issue Title *</Label>
                        <Input
                          id="title"
                          name="title"
                          required
                          placeholder="e.g., Leaking faucet in bathroom"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <select
                          id="category"
                          name="category"
                          required
                          className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                        >
                          <option value="PLUMBING">Plumbing</option>
                          <option value="ELECTRICAL">Electrical</option>
                          <option value="APPLIANCE">Appliance</option>
                          <option value="HVAC">HVAC</option>
                          <option value="STRUCTURAL">Structural</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority *</Label>
                        <select
                          id="priority"
                          name="priority"
                          required
                          className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                        >
                          <option value="LOW">Low - Not urgent</option>
                          <option value="MEDIUM">Medium - Needs attention soon</option>
                          <option value="HIGH">High - Urgent</option>
                          <option value="URGENT">Emergency</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <textarea
                          id="description"
                          name="description"
                          required
                          rows={4}
                          className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                          placeholder="Please describe the issue in detail..."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMaintenanceDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={maintenanceMutation.isPending}>
                          {maintenanceMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Request'
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {maintenanceRequests.length > 0 ? (
                <div className="space-y-3">
                  {maintenanceRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between border-b pb-3"
                    >
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          request.status === 'COMPLETED'
                            ? 'default'
                            : request.status === 'IN_PROGRESS'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground py-6 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8" />
                  <p>No maintenance requests</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Recent Payments
              </CardTitle>
              <CardDescription>Your payment history</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPayments.length > 0 ? (
                <div className="space-y-3">
                  {recentPayments.slice(0, 3).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between border-b pb-3"
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(payment.paymentDate)}
                        </p>
                      </div>
                      <Badge variant={payment.status === 'PAID' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/portal/payments">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Payments
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-muted-foreground space-y-4 py-6 text-center">
                  <Clock className="mx-auto mb-2 h-8 w-8" />
                  <p>No payment history</p>
                  <Link href="/portal/payments">
                    <Button variant="outline" size="sm" className="w-full">
                      View Payments
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              <CardDescription>View your documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground space-y-4 py-6 text-center">
                <FileText className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm">
                  Access your lease agreements, identification, and other important documents
                </p>
                <Link href="/portal/documents">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
