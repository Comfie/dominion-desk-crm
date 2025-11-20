'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Home,
  CreditCard,
  AlertCircle,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';

async function fetchTenant(id: string) {
  const response = await fetch(`/api/tenants/${id}`);
  if (!response.ok) throw new Error('Failed to fetch tenant');
  return response.json();
}

async function fetchPortalAccess(id: string) {
  const response = await fetch(`/api/tenants/${id}/portal-access`);
  if (!response.ok) throw new Error('Failed to fetch portal access');
  return response.json();
}

async function fetchAvailableProperties(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetch(`/api/properties/available?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch available properties');
  return response.json();
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  BLACKLISTED: 'bg-red-100 text-red-800 border-red-200',
};

const typeLabels: Record<string, string> = {
  GUEST: 'Guest',
  TENANT: 'Tenant',
  BOTH: 'Guest & Tenant',
};

const employmentLabels: Record<string, string> = {
  EMPLOYED: 'Employed',
  SELF_EMPLOYED: 'Self-Employed',
  UNEMPLOYED: 'Unemployed',
  RETIRED: 'Retired',
  STUDENT: 'Student',
};

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [actionType, setActionType] = useState<'create' | 'reset'>('create');

  // Property assignment states
  const [showAssignPropertyDialog, setShowAssignPropertyDialog] = useState(false);
  const [showTerminateLeaseDialog, setShowTerminateLeaseDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [depositPaid, setDepositPaid] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [moveOutDate, setMoveOutDate] = useState('');
  const [propertyToTerminate, setPropertyToTerminate] = useState<string | null>(null);

  const {
    data: tenant,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => fetchTenant(id),
  });

  const { data: portalAccess, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['tenant-portal-access', id],
    queryFn: () => fetchPortalAccess(id),
  });

  const portalAccessMutation = useMutation({
    mutationFn: async ({
      action,
      password,
    }: {
      action: 'create' | 'reset' | 'revoke';
      password?: string;
    }) => {
      const response = await fetch(`/api/tenants/${id}/portal-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to manage portal access');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-portal-access', id] });
      setShowPasswordDialog(false);
      setShowRevokeDialog(false);
      setPassword('');
    },
  });

  const handleCreateAccess = () => {
    setActionType('create');
    setShowPasswordDialog(true);
  };

  const handleResetPassword = () => {
    setActionType('reset');
    setShowPasswordDialog(true);
  };

  const handleRevokeAccess = () => {
    setShowRevokeDialog(true);
  };

  const handlePasswordSubmit = () => {
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    portalAccessMutation.mutate({ action: actionType, password });
  };

  const handleRevokeConfirm = () => {
    portalAccessMutation.mutate({ action: 'revoke' });
  };

  // Property assignment queries and mutations
  const { data: availableProperties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['available-properties', leaseStartDate, leaseEndDate],
    queryFn: () => fetchAvailableProperties(leaseStartDate, leaseEndDate),
    enabled: showAssignPropertyDialog,
  });

  const assignPropertyMutation = useMutation({
    mutationFn: async (data: {
      propertyId: string;
      leaseStartDate: string;
      leaseEndDate?: string;
      monthlyRent: number;
      depositPaid?: number;
      moveInDate?: string;
    }) => {
      const response = await fetch(`/api/tenants/${id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign property');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      setShowAssignPropertyDialog(false);
      setSelectedProperty('');
      setLeaseStartDate('');
      setLeaseEndDate('');
      setMonthlyRent('');
      setDepositPaid('');
      setMoveInDate('');
    },
  });

  const terminateLeaseMutation = useMutation({
    mutationFn: async (data: { propertyId: string; moveOutDate: string }) => {
      const response = await fetch(`/api/tenants/${id}/properties/${data.propertyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveOutDate: data.moveOutDate }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to terminate lease');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      setShowTerminateLeaseDialog(false);
      setMoveOutDate('');
      setPropertyToTerminate(null);
    },
  });

  const handleAssignProperty = () => {
    setShowAssignPropertyDialog(true);
  };

  const handleAssignPropertySubmit = () => {
    if (!selectedProperty || !leaseStartDate || !monthlyRent) {
      alert('Please fill in all required fields');
      return;
    }

    assignPropertyMutation.mutate({
      propertyId: selectedProperty,
      leaseStartDate,
      leaseEndDate: leaseEndDate || undefined,
      monthlyRent: parseFloat(monthlyRent),
      depositPaid: depositPaid ? parseFloat(depositPaid) : 0,
      moveInDate: moveInDate || undefined,
    });
  };

  const handleTerminateLease = (propertyId: string) => {
    setPropertyToTerminate(propertyId);
    setShowTerminateLeaseDialog(true);
  };

  const handleTerminateLeaseSubmit = () => {
    if (!propertyToTerminate || !moveOutDate) {
      alert('Please enter a move-out date');
      return;
    }

    terminateLeaseMutation.mutate({
      propertyId: propertyToTerminate,
      moveOutDate,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg">Tenant not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </Button>
      </div>
    );
  }

  const fullName = `${tenant.firstName} ${tenant.lastName}`;

  return (
    <div className="space-y-6">
      <PageHeader title={fullName} description={tenant.email}>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/tenants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/tenants/${tenant.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Tenant
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status and Type */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tenant Status</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[tenant.status] || statusColors.ACTIVE}>
                    {tenant.status}
                  </Badge>
                  <Badge variant="outline">{typeLabels[tenant.tenantType]}</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Email</p>
                      <a
                        href={`mailto:${tenant.email}`}
                        className="hover:text-primary font-medium transition-colors"
                      >
                        {tenant.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Phone</p>
                      <a
                        href={`tel:${tenant.phone}`}
                        className="hover:text-primary font-medium transition-colors"
                      >
                        {tenant.phone}
                      </a>
                    </div>
                  </div>

                  {tenant.alternatePhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-muted-foreground text-sm">Alternate Phone</p>
                        <p className="font-medium">{tenant.alternatePhone}</p>
                      </div>
                    </div>
                  )}

                  {tenant.idNumber && (
                    <div className="flex items-center gap-3">
                      <User className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-muted-foreground text-sm">ID Number</p>
                        <p className="font-medium">{tenant.idNumber}</p>
                      </div>
                    </div>
                  )}

                  {tenant.dateOfBirth && (
                    <div className="flex items-center gap-3">
                      <Calendar className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-muted-foreground text-sm">Date of Birth</p>
                        <p className="font-medium">{formatDate(tenant.dateOfBirth)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address */}
              {tenant.currentAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle>Current Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <MapPin className="text-muted-foreground mt-0.5 h-5 w-5" />
                      <div>
                        <p className="font-medium">{tenant.currentAddress}</p>
                        {tenant.city && (
                          <p className="text-muted-foreground text-sm">
                            {tenant.city}
                            {tenant.province && `, ${tenant.province}`}
                            {tenant.postalCode && ` ${tenant.postalCode}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Employment */}
              {tenant.employmentStatus && (
                <Card>
                  <CardHeader>
                    <CardTitle>Employment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Briefcase className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-muted-foreground text-sm">Status</p>
                        <p className="font-medium">{employmentLabels[tenant.employmentStatus]}</p>
                      </div>
                    </div>

                    {tenant.employer && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="text-muted-foreground h-5 w-5" />
                        <div>
                          <p className="text-muted-foreground text-sm">Employer</p>
                          <p className="font-medium">{tenant.employer}</p>
                        </div>
                      </div>
                    )}

                    {tenant.monthlyIncome && (
                      <div className="flex items-center gap-3">
                        <CreditCard className="text-muted-foreground h-5 w-5" />
                        <div>
                          <p className="text-muted-foreground text-sm">Monthly Income</p>
                          <p className="font-medium">
                            {formatCurrency(Number(tenant.monthlyIncome))}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Emergency Contact */}
              {tenant.emergencyContactName && (
                <Card>
                  <CardHeader>
                    <CardTitle>Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{tenant.emergencyContactName}</p>
                    {tenant.emergencyContactRelation && (
                      <p className="text-muted-foreground text-sm">
                        {tenant.emergencyContactRelation}
                      </p>
                    )}
                    {tenant.emergencyContactPhone && (
                      <a
                        href={`tel:${tenant.emergencyContactPhone}`}
                        className="hover:text-primary text-sm transition-colors"
                      >
                        {tenant.emergencyContactPhone}
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {tenant.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {tenant.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {tenant.bookings && tenant.bookings.length > 0 ? (
                    <div className="space-y-4">
                      {tenant.bookings.map((booking: any) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between border-b pb-4 last:border-0"
                        >
                          <div>
                            <Link
                              href={`/bookings/${booking.id}`}
                              className="hover:text-primary font-medium transition-colors"
                            >
                              {booking.property.name}
                            </Link>
                            <p className="text-muted-foreground text-sm">
                              {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                            </p>
                          </div>
                          <Badge>{booking.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No bookings found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {tenant.payments && tenant.payments.length > 0 ? (
                    <div className="space-y-4">
                      {tenant.payments.map((payment: any) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between border-b pb-4 last:border-0"
                        >
                          <div>
                            <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                            <p className="text-muted-foreground text-sm">
                              {formatDate(payment.paymentDate)}
                            </p>
                          </div>
                          <Badge variant="outline">{payment.paymentMethod}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No payments found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Portal Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Portal Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {portalAccess?.hasPortalAccess ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Enabled</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-gray-400" />
                    <span className="text-muted-foreground text-sm">Not enabled</span>
                  </>
                )}
              </div>

              {portalAccess?.hasPortalAccess ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs">
                    Tenant can log in at <strong>/portal/login</strong>
                  </p>
                  {portalAccess?.createdAt && (
                    <p className="text-muted-foreground text-xs">
                      Created: {formatDate(portalAccess.createdAt)}
                    </p>
                  )}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleResetPassword}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={portalAccessMutation.isPending}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Reset Password
                    </Button>
                    <Button
                      onClick={handleRevokeAccess}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      disabled={portalAccessMutation.isPending}
                    >
                      Revoke Access
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs">
                    Create portal access to allow tenant to view rental information online.
                  </p>
                  <Button
                    onClick={handleCreateAccess}
                    disabled={portalAccessMutation.isPending}
                    size="sm"
                    className="w-full"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Create Access
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Properties */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Properties
                </CardTitle>
                <Button
                  onClick={handleAssignProperty}
                  size="sm"
                  variant="outline"
                  disabled={assignPropertyMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tenant.properties && tenant.properties.length > 0 ? (
                <div className="space-y-4">
                  {tenant.properties.map((pt: any) => (
                    <div key={pt.property.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Link
                            href={`/properties/${pt.property.id}`}
                            className="hover:text-primary font-medium transition-colors"
                          >
                            {pt.property.name}
                          </Link>
                          <p className="text-muted-foreground text-sm">
                            {pt.property.address}, {pt.property.city}
                          </p>
                          {pt.leaseStartDate && (
                            <p className="text-muted-foreground text-xs">
                              Lease: {formatDate(pt.leaseStartDate)}
                              {pt.leaseEndDate && ` - ${formatDate(pt.leaseEndDate)}`}
                            </p>
                          )}
                          {pt.monthlyRent && (
                            <p className="text-xs font-medium">
                              Rent: {formatCurrency(Number(pt.monthlyRent))}
                            </p>
                          )}
                          {pt.isActive && (
                            <Badge className="mt-1 border-green-200 bg-green-100 text-green-800">
                              Active
                            </Badge>
                          )}
                        </div>
                        {pt.isActive && (
                          <Button
                            onClick={() => handleTerminateLease(pt.property.id)}
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm">No properties assigned</p>
                  <Button
                    onClick={handleAssignProperty}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Property
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Record Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(tenant.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(tenant.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'create' ? 'Create Portal Access' : 'Reset Portal Password'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'create'
                ? 'Set a password for the tenant to access the portal.'
                : 'Enter a new password for the tenant.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={portalAccessMutation.isPending}>
              {portalAccessMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : actionType === 'create' ? (
                'Create Access'
              ) : (
                'Reset Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Portal Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this tenant's portal access? They will no longer be
              able to log in to view their information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeConfirm}
              disabled={portalAccessMutation.isPending}
            >
              {portalAccessMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Access'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Property Dialog */}
      <Dialog open={showAssignPropertyDialog} onOpenChange={setShowAssignPropertyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Property to Tenant</DialogTitle>
            <DialogDescription>
              Select a property and enter lease details to assign it to this tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProperties ? (
                    <SelectItem value="loading" disabled>
                      Loading properties...
                    </SelectItem>
                  ) : availableProperties && availableProperties.length > 0 ? (
                    availableProperties.map((property: any) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name} - {property.address}, {property.city}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No available properties
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="leaseStartDate">Lease Start Date *</Label>
                <Input
                  id="leaseStartDate"
                  type="date"
                  value={leaseStartDate}
                  onChange={(e) => setLeaseStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaseEndDate">Lease End Date</Label>
                <Input
                  id="leaseEndDate"
                  type="date"
                  value={leaseEndDate}
                  onChange={(e) => setLeaseEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rent (R) *</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  placeholder="0.00"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositPaid">Deposit Paid (R)</Label>
                <Input
                  id="depositPaid"
                  type="number"
                  placeholder="0.00"
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moveInDate">Move-In Date</Label>
              <Input
                id="moveInDate"
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignPropertyDialog(false);
                setSelectedProperty('');
                setLeaseStartDate('');
                setLeaseEndDate('');
                setMonthlyRent('');
                setDepositPaid('');
                setMoveInDate('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignPropertySubmit}
              disabled={assignPropertyMutation.isPending}
            >
              {assignPropertyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Property'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Lease Dialog */}
      <Dialog open={showTerminateLeaseDialog} onOpenChange={setShowTerminateLeaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Lease</DialogTitle>
            <DialogDescription>
              Enter the move-out date to terminate this lease. This will mark the property
              assignment as inactive.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="moveOutDate">Move-Out Date *</Label>
              <Input
                id="moveOutDate"
                type="date"
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTerminateLeaseDialog(false);
                setMoveOutDate('');
                setPropertyToTerminate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTerminateLeaseSubmit}
              disabled={terminateLeaseMutation.isPending}
            >
              {terminateLeaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Terminating...
                </>
              ) : (
                'Terminate Lease'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
