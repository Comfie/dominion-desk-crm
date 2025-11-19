'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';

async function fetchTenant(id: string) {
  const response = await fetch(`/api/tenants/${id}`);
  if (!response.ok) throw new Error('Failed to fetch tenant');
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

  const {
    data: tenant,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => fetchTenant(id),
  });

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
          {/* Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.properties && tenant.properties.length > 0 ? (
                <div className="space-y-4">
                  {tenant.properties.map((pt: any) => (
                    <div key={pt.property.id}>
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No properties assigned</p>
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
    </div>
  );
}
