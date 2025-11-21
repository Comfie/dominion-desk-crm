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
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/portal/dashboard" className="flex items-center gap-2 text-white">
            <Building2 className="h-6 w-6" />
            <span className="text-lg font-semibold">Tenant Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80">
              {tenant.firstName} {tenant.lastName}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
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
                    <p>
                      <span className="text-muted-foreground">Rent: </span>
                      <span className="font-semibold">
                        {formatCurrency(Number(tenant.rentAmount))}/month
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Maintenance Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Maintenance
                </CardTitle>
                <CardDescription>Your maintenance requests</CardDescription>
              </div>
              <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Request
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
                  {recentPayments.map((payment) => (
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
                </div>
              ) : (
                <div className="text-muted-foreground py-6 text-center">
                  <Clock className="mx-auto mb-2 h-8 w-8" />
                  <p>No payment history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
