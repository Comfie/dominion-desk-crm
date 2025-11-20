'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  Phone,
  Home,
  Calendar,
  Users,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  UserPlus,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';

async function fetchInquiry(id: string) {
  const response = await fetch(`/api/inquiries/${id}`);
  if (!response.ok) throw new Error('Failed to fetch inquiry');
  return response.json();
}

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RESPONDED: 'bg-green-100 text-green-800 border-green-200',
  CONVERTED: 'bg-purple-100 text-purple-800 border-purple-200',
  CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
  SPAM: 'bg-red-100 text-red-800 border-red-200',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const sourceLabels: Record<string, string> = {
  DIRECT: 'Direct',
  AIRBNB: 'Airbnb',
  BOOKING_COM: 'Booking.com',
  WEBSITE: 'Website',
  PHONE: 'Phone',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  REFERRAL: 'Referral',
  OTHER: 'Other',
};

const typeLabels: Record<string, string> = {
  BOOKING: 'Booking Inquiry',
  VIEWING: 'Viewing Request',
  GENERAL: 'General Inquiry',
  COMPLAINT: 'Complaint',
  MAINTENANCE: 'Maintenance Request',
};

export default function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [response, setResponse] = useState('');

  const {
    data: inquiry,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inquiry', id],
    queryFn: () => fetchInquiry(id),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { status?: string; priority?: string; response?: string }) => {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update inquiry');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiry', id] });
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      setResponse('');
    },
  });

  const handleSendResponse = () => {
    if (!response.trim()) return;
    updateMutation.mutate({ response });
  };

  const handleStatusChange = (status: string) => {
    updateMutation.mutate({ status });
  };

  const handleConvertToBooking = () => {
    updateMutation.mutate({ status: 'CONVERTED' });
    // Redirect to create booking with pre-filled data
    const params = new URLSearchParams();
    if (inquiry.propertyId) params.set('propertyId', inquiry.propertyId);
    if (inquiry.checkInDate) params.set('checkIn', inquiry.checkInDate.split('T')[0]);
    if (inquiry.checkOutDate) params.set('checkOut', inquiry.checkOutDate.split('T')[0]);
    if (inquiry.numberOfGuests) params.set('guests', inquiry.numberOfGuests.toString());
    params.set('guestName', inquiry.contactName);
    params.set('guestEmail', inquiry.contactEmail);
    if (inquiry.contactPhone) params.set('guestPhone', inquiry.contactPhone);
    router.push(`/bookings/new?${params.toString()}`);
  };

  const handleConvertToTenant = () => {
    updateMutation.mutate({ status: 'CONVERTED' });
    // Redirect to create tenant with pre-filled data
    const params = new URLSearchParams();
    params.set('firstName', inquiry.contactName.split(' ')[0] || inquiry.contactName);
    params.set('lastName', inquiry.contactName.split(' ').slice(1).join(' ') || '');
    params.set('email', inquiry.contactEmail);
    if (inquiry.contactPhone) params.set('phone', inquiry.contactPhone);
    if (inquiry.propertyId) params.set('propertyId', inquiry.propertyId);
    if (inquiry.checkInDate) params.set('leaseStartDate', inquiry.checkInDate.split('T')[0]);
    if (inquiry.checkOutDate) params.set('leaseEndDate', inquiry.checkOutDate.split('T')[0]);
    router.push(`/tenants/new?${params.toString()}`);
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
          </div>
        </div>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg">Inquiry not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/inquiries">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inquiries
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={inquiry.contactName} description={typeLabels[inquiry.inquiryType]}>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/inquiries">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status and Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusColors[inquiry.status] || statusColors.NEW}>
                    {inquiry.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={priorityColors[inquiry.priority]}>
                    {inquiry.priority}
                  </Badge>
                  <Badge variant="outline">{sourceLabels[inquiry.inquirySource]}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {inquiry.status !== 'RESPONDED' && inquiry.status !== 'CONVERTED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    disabled={updateMutation.isPending}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark In Progress
                  </Button>
                )}
                {inquiry.inquiryType === 'BOOKING' && inquiry.status !== 'CONVERTED' && (
                  <Button
                    size="sm"
                    onClick={handleConvertToBooking}
                    disabled={updateMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Convert to Booking
                  </Button>
                )}
                {inquiry.inquiryType === 'VIEWING' && inquiry.status !== 'CONVERTED' && (
                  <Button
                    size="sm"
                    onClick={handleConvertToTenant}
                    disabled={updateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convert to Tenant
                  </Button>
                )}
                {inquiry.status !== 'CLOSED' && inquiry.status !== 'SPAM' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('CLOSED')}
                      disabled={updateMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Close
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('SPAM')}
                      disabled={updateMutation.isPending}
                    >
                      Mark as Spam
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Original Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Original Message
              </CardTitle>
              <CardDescription>Received {formatDateTime(inquiry.createdAt)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{inquiry.message}</p>
            </CardContent>
          </Card>

          {/* Response Section */}
          <Card>
            <CardHeader>
              <CardTitle>{inquiry.response ? 'Your Response' : 'Send Response'}</CardTitle>
              {inquiry.respondedAt && (
                <CardDescription>Sent {formatDateTime(inquiry.respondedAt)}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {inquiry.response ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{inquiry.response}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response..."
                    rows={6}
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendResponse}
                      disabled={!response.trim() || updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Response
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
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
                    href={`mailto:${inquiry.contactEmail}`}
                    className="hover:text-primary font-medium transition-colors"
                  >
                    {inquiry.contactEmail}
                  </a>
                </div>
              </div>

              {inquiry.contactPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="text-muted-foreground text-sm">Phone</p>
                    <a
                      href={`tel:${inquiry.contactPhone}`}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {inquiry.contactPhone}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Info */}
          {inquiry.property && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/properties/${inquiry.property.id}`}
                  className="hover:text-primary font-medium transition-colors"
                >
                  {inquiry.property.name}
                </Link>
                <p className="text-muted-foreground text-sm">
                  {inquiry.property.address}, {inquiry.property.city}
                </p>
                {inquiry.property.dailyRate && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    Daily rate: {formatCurrency(Number(inquiry.property.dailyRate))}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Booking Details */}
          {(inquiry.checkInDate || inquiry.checkOutDate || inquiry.numberOfGuests) && (
            <Card>
              <CardHeader>
                <CardTitle>Booking Interest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {inquiry.checkInDate && inquiry.checkOutDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Dates</p>
                      <p className="font-medium">
                        {formatDate(inquiry.checkInDate)} - {formatDate(inquiry.checkOutDate)}
                      </p>
                    </div>
                  </div>
                )}

                {inquiry.numberOfGuests && (
                  <div className="flex items-center gap-3">
                    <Users className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Guests</p>
                      <p className="font-medium">
                        {inquiry.numberOfGuests} {inquiry.numberOfGuests === 1 ? 'guest' : 'guests'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(inquiry.createdAt)}</span>
              </div>
              {inquiry.respondedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responded</span>
                  <span>{formatDate(inquiry.respondedAt)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(inquiry.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
