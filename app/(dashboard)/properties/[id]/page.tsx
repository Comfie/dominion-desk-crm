'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize,
  Home,
  Calendar,
  DollarSign,
  Check,
  X,
  Star,
  RefreshCw,
  Download,
  Plus,
  Loader2,
  Link as LinkIcon,
  Copy,
  Eye,
  FolderOpen,
  FileText,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';

async function fetchProperty(id: string) {
  const response = await fetch(`/api/properties/${id}`);
  if (!response.ok) throw new Error('Failed to fetch property');
  return response.json();
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  OCCUPIED: 'bg-blue-100 text-blue-800 border-blue-200',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ARCHIVED: 'bg-red-100 text-red-800 border-red-200',
};

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: 'Apartment',
  HOUSE: 'House',
  TOWNHOUSE: 'Townhouse',
  COTTAGE: 'Cottage',
  ROOM: 'Room',
  STUDIO: 'Studio',
  DUPLEX: 'Duplex',
  PENTHOUSE: 'Penthouse',
  VILLA: 'Villa',
  OTHER: 'Other',
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [newCalendarUrl, setNewCalendarUrl] = useState('');
  const [calendarSource, setCalendarSource] = useState<'AIRBNB' | 'BOOKING_COM' | 'OTHER'>(
    'AIRBNB'
  );
  const [showExportUrl, setShowExportUrl] = useState(false);
  const [exportUrl, setExportUrl] = useState('');

  const {
    data: property,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchProperty(id),
  });

  // Sync calendar mutation
  const syncCalendarMutation = useMutation({
    mutationFn: async ({
      url,
      source,
    }: {
      url: string;
      source: 'AIRBNB' | 'BOOKING_COM' | 'OTHER';
    }) => {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: id,
          calendarUrl: url,
          source,
        }),
      });
      if (!response.ok) throw new Error('Failed to sync calendar');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      setNewCalendarUrl('');
    },
  });

  // Get export URL mutation
  const getExportUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/calendar/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id }),
      });
      if (!response.ok) throw new Error('Failed to get export URL');
      return response.json();
    },
    onSuccess: (data) => {
      setExportUrl(data.calendarUrl);
      setShowExportUrl(true);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            <Skeleton className="aspect-video w-full rounded-lg" />
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

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg">Property not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.name}
        description={`${propertyTypeLabels[property.propertyType]} in ${property.city}`}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/properties">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/properties/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Property
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Property Image */}
          <Card className="overflow-hidden">
            <div className="bg-muted relative aspect-video">
              {property.primaryImageUrl ? (
                <Image
                  src={property.primaryImageUrl}
                  alt={property.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Home className="text-muted-foreground/50 h-16 w-16" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge className={statusColors[property.status] || statusColors.ACTIVE}>
                  {property.status}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Description */}
              {property.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Features & Amenities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <Bed className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium">{property.bedrooms}</p>
                        <p className="text-muted-foreground text-xs">Bedrooms</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium">{property.bathrooms}</p>
                        <p className="text-muted-foreground text-xs">Bathrooms</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium">{property.parkingSpaces}</p>
                        <p className="text-muted-foreground text-xs">Parking</p>
                      </div>
                    </div>
                    {property.size && (
                      <div className="flex items-center gap-2">
                        <Maximize className="text-muted-foreground h-5 w-5" />
                        <div>
                          <p className="text-sm font-medium">{property.size} m²</p>
                          <p className="text-muted-foreground text-xs">Size</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      {property.furnished ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="text-muted-foreground h-4 w-4" />
                      )}
                      <span className="text-sm">Furnished</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {property.petsAllowed ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="text-muted-foreground h-4 w-4" />
                      )}
                      <span className="text-sm">Pets Allowed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {property.smokingAllowed ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="text-muted-foreground h-4 w-4" />
                      )}
                      <span className="text-sm">Smoking Allowed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* House Rules */}
              {property.houseRules && (
                <Card>
                  <CardHeader>
                    <CardTitle>House Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {property.houseRules}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>{property._count?.bookings || 0} total bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  {property.bookings?.length > 0 ? (
                    <div className="space-y-4">
                      {property.bookings.map(
                        (booking: {
                          id: string;
                          guestName: string;
                          checkInDate: string;
                          checkOutDate: string;
                          status: string;
                          totalAmount: number;
                        }) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                          >
                            <div>
                              <p className="font-medium">{booking.guestName}</p>
                              <p className="text-muted-foreground text-sm">
                                {formatDate(booking.checkInDate)} -{' '}
                                {formatDate(booking.checkOutDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{booking.status}</Badge>
                              <p className="mt-1 text-sm font-medium">
                                {formatCurrency(Number(booking.totalAmount))}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-4 text-center">No bookings yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              {/* Import External Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Import External Calendar
                  </CardTitle>
                  <CardDescription>
                    Sync bookings from Airbnb, Booking.com, or other platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="calendarSource">Source</Label>
                      <select
                        id="calendarSource"
                        value={calendarSource}
                        onChange={(e) =>
                          setCalendarSource(e.target.value as 'AIRBNB' | 'BOOKING_COM' | 'OTHER')
                        }
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <option value="AIRBNB">Airbnb</option>
                        <option value="BOOKING_COM">Booking.com</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calendarUrl">iCal URL</Label>
                      <Input
                        id="calendarUrl"
                        placeholder="https://..."
                        value={newCalendarUrl}
                        onChange={(e) => setNewCalendarUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      syncCalendarMutation.mutate({ url: newCalendarUrl, source: calendarSource })
                    }
                    disabled={!newCalendarUrl || syncCalendarMutation.isPending}
                  >
                    {syncCalendarMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Import Calendar
                      </>
                    )}
                  </Button>
                  {syncCalendarMutation.isSuccess && (
                    <p className="text-sm text-green-600">
                      Successfully imported {syncCalendarMutation.data.imported} bookings, updated{' '}
                      {syncCalendarMutation.data.updated} bookings
                    </p>
                  )}
                  {syncCalendarMutation.isError && (
                    <p className="text-sm text-red-600">
                      Failed to sync calendar. Please check the URL and try again.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Export Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Calendar
                  </CardTitle>
                  <CardDescription>Share your calendar with external platforms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <a href={`/api/calendar/export?propertyId=${id}`} download>
                        <Download className="mr-2 h-4 w-4" />
                        Download .ics File
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => getExportUrlMutation.mutate()}
                      disabled={getExportUrlMutation.isPending}
                    >
                      {getExportUrlMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LinkIcon className="mr-2 h-4 w-4" />
                      )}
                      Get Shareable URL
                    </Button>
                  </div>
                  {showExportUrl && exportUrl && (
                    <div className="bg-muted flex items-center gap-2 rounded-md p-3">
                      <Input value={exportUrl} readOnly className="flex-1" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(exportUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sync Info */}
              <Card>
                <CardHeader>
                  <CardTitle>How Calendar Sync Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    <strong>Import:</strong> Paste your iCal URL from Airbnb or Booking.com to
                    import blocked dates as bookings.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    <strong>Export:</strong> Use the shareable URL in your Airbnb/Booking.com
                    settings to block dates automatically.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    <strong>Tip:</strong> Set up both import and export to keep all platforms in
                    sync and prevent double bookings.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Requests</CardTitle>
                  <CardDescription>Recent maintenance and repair requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {property.maintenanceRequests?.length > 0 ? (
                    <div className="space-y-4">
                      {property.maintenanceRequests.map(
                        (request: {
                          id: string;
                          title: string;
                          status: string;
                          priority: string;
                          createdAt: string;
                        }) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                          >
                            <div>
                              <p className="font-medium">{request.title}</p>
                              <p className="text-muted-foreground text-sm">
                                {formatDate(request.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{request.priority}</Badge>
                              <Badge>{request.status}</Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-4 text-center">
                      No maintenance requests
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Document Management</CardTitle>
                    <Button asChild>
                      <Link href={`/properties/${id}/documents`}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Open Document Manager
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
                    <div className="rounded-full bg-blue-100 p-6">
                      <FileText className="h-12 w-12 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">
                        Folder-Based Document Organization
                      </h3>
                      <p className="max-w-md text-sm text-gray-500">
                        Manage all property documents in organized folders. Upload, view, and
                        organize documents like title deeds, insurance policies, inspection reports,
                        and more.
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      <Button asChild size="lg">
                        <Link href={`/properties/${id}/documents`}>
                          <FolderOpen className="mr-2 h-5 w-5" />
                          Open Document Manager
                        </Link>
                      </Button>
                      <p className="text-xs text-gray-400">
                        View and manage documents with folder organization
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Property Expenses</CardTitle>
                    <CardDescription>
                      {property._count?.expenses || 0} total expenses
                    </CardDescription>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/financials/expenses/new?propertyId=${id}`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {property.expenses?.length > 0 ? (
                    <div className="space-y-4">
                      {property.expenses.map(
                        (expense: {
                          id: string;
                          title: string;
                          category: string;
                          amount: number;
                          expenseDate: string;
                          status: string;
                          isDeductible: boolean;
                        }) => (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                          >
                            <div>
                              <p className="font-medium">{expense.title}</p>
                              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Badge variant="outline">
                                  {expense.category.replace('_', ' ')}
                                </Badge>
                                <span>{formatDate(expense.expenseDate)}</span>
                                {expense.isDeductible && (
                                  <Badge variant="secondary" className="text-xs">
                                    Tax Deductible
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600">
                                {formatCurrency(Number(expense.amount))}
                              </p>
                              <Badge
                                className={`text-xs ${
                                  expense.status === 'PAID'
                                    ? 'bg-green-100 text-green-800'
                                    : expense.status === 'OVERDUE'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {expense.status}
                              </Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <DollarSign className="text-muted-foreground/50 mx-auto h-12 w-12" />
                      <p className="text-muted-foreground mt-4">No expenses recorded</p>
                      <Button asChild className="mt-4">
                        <Link href={`/financials/expenses/new?propertyId=${id}`}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Expense
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.monthlyRent && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monthly Rent</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(Number(property.monthlyRent))}
                  </span>
                </div>
              )}
              {property.dailyRate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Daily Rate</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(Number(property.dailyRate))}
                  </span>
                </div>
              )}
              {property.securityDeposit && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Security Deposit</span>
                  <span className="font-medium">
                    {formatCurrency(Number(property.securityDeposit))}
                  </span>
                </div>
              )}
              {property.cleaningFee && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cleaning Fee</span>
                  <span className="font-medium">
                    {formatCurrency(Number(property.cleaningFee))}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valuation Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Valuation
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/properties/${id}/valuations`}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.purchasePrice || property.currentValuation ? (
                <>
                  {property.purchasePrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Purchase Price</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(Number(property.purchasePrice))}
                      </span>
                    </div>
                  )}
                  {property.purchaseDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Purchase Date</span>
                      <span className="font-medium">{formatDate(property.purchaseDate)}</span>
                    </div>
                  )}
                  {property.currentValuation && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current Value</span>
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(Number(property.currentValuation))}
                      </span>
                    </div>
                  )}
                  {property.lastValuationDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Valued</span>
                      <span className="font-medium">{formatDate(property.lastValuationDate)}</span>
                    </div>
                  )}
                  {property.purchasePrice && property.currentValuation && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Appreciation</span>
                        <span
                          className={`font-medium ${
                            Number(property.currentValuation) >= Number(property.purchasePrice)
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {(
                            ((Number(property.currentValuation) - Number(property.purchasePrice)) /
                              Number(property.purchasePrice)) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground py-2 text-center text-sm">
                  No valuation data yet. Add a purchase price or valuation to track property value.
                </p>
              )}
              <Separator />
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/properties/${id}/valuations`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Valuations
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{property.address}</p>
              <p className="text-muted-foreground">
                {property.city}, {property.province}
              </p>
              <p className="text-muted-foreground">{property.postalCode}</p>
            </CardContent>
          </Card>

          {/* Check-in/out Times */}
          {(property.checkInTime || property.checkOutTime) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Check-in/out
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {property.checkInTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium">{property.checkInTime}</span>
                  </div>
                )}
                {property.checkOutTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium">{property.checkOutTime}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Bookings</span>
                <span className="font-medium">{property._count?.bookings || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reviews</span>
                <span className="font-medium">{property._count?.reviews || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses</span>
                <span className="font-medium">{property._count?.expenses || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
