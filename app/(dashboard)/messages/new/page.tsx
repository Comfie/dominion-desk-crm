'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const messageSchema = z.object({
  messageType: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP']),
  recipientEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  recipientPhone: z.string().optional(),
  recipientName: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  bookingId: z.string().optional(),
  tenantId: z.string().optional(),
  template: z.string().optional(),
});

type MessageFormData = z.infer<typeof messageSchema>;

async function fetchBookings() {
  const response = await fetch('/api/bookings?limit=100');
  if (!response.ok) throw new Error('Failed to fetch bookings');
  const data = await response.json();
  return data.bookings || [];
}

async function fetchTenants() {
  const response = await fetch('/api/tenants?limit=100');
  if (!response.ok) throw new Error('Failed to fetch tenants');
  const data = await response.json();
  return data.tenants || [];
}

export default function ComposeMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBookingId = searchParams.get('bookingId');
  const preselectedTenantId = searchParams.get('tenantId');

  const [selectedTemplate, setSelectedTemplate] = useState('');

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-list'],
    queryFn: fetchBookings,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: fetchTenants,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      messageType: 'EMAIL',
      bookingId: preselectedBookingId || '',
      tenantId: preselectedTenantId || '',
    },
  });

  const messageType = watch('messageType');
  const bookingId = watch('bookingId');
  const tenantId = watch('tenantId');

  // Auto-fill recipient based on booking or tenant selection
  const selectedBooking = bookings.find((b: { id: string }) => b.id === bookingId);
  const selectedTenant = tenants.find((t: { id: string }) => t.id === tenantId);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          template: selectedTemplate || undefined,
          templateData: selectedTemplate
            ? {
                guestName: selectedBooking?.guestName || selectedTenant?.firstName,
                recipientName:
                  selectedBooking?.guestName ||
                  (selectedTenant ? `${selectedTenant.firstName} ${selectedTenant.lastName}` : ''),
                propertyName: selectedBooking?.property?.name,
                checkIn: selectedBooking?.checkIn,
                checkOut: selectedBooking?.checkOut,
                totalAmount: selectedBooking?.totalAmount?.toString(),
                address: selectedBooking?.property?.address,
              }
            : undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      router.push('/messages');
    },
  });

  const onSubmit = (data: MessageFormData) => {
    // Auto-fill recipient email/phone if not provided
    if (!data.recipientEmail && messageType === 'EMAIL') {
      data.recipientEmail = selectedBooking?.guestEmail || selectedTenant?.email || '';
    }
    if (!data.recipientPhone && (messageType === 'SMS' || messageType === 'WHATSAPP')) {
      data.recipientPhone = selectedBooking?.guestPhone || selectedTenant?.phone || '';
    }
    if (!data.recipientName) {
      data.recipientName =
        selectedBooking?.guestName ||
        (selectedTenant ? `${selectedTenant.firstName} ${selectedTenant.lastName}` : '');
    }

    sendMessageMutation.mutate(data);
  };

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);

    // Set default subject based on template
    switch (template) {
      case 'bookingConfirmation':
        setValue('subject', 'Booking Confirmation');
        setValue('message', 'Your booking has been confirmed. Please see the details below.');
        break;
      case 'checkInReminder':
        setValue('subject', 'Check-in Reminder');
        setValue('message', 'This is a reminder about your upcoming check-in.');
        break;
      case 'paymentReminder':
        setValue('subject', 'Payment Reminder');
        setValue('message', 'This is a friendly reminder that a payment is due.');
        break;
      case 'maintenanceUpdate':
        setValue('subject', 'Maintenance Update');
        setValue('message', 'We wanted to update you on the status of your maintenance request.');
        break;
      default:
        setValue('subject', '');
        setValue('message', '');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Compose Message" description="Send a new message to a guest or tenant">
        <Link href="/messages">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Message Details</CardTitle>
                <CardDescription>Compose your message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="messageType">Message Type</Label>
                    <Select
                      value={messageType}
                      onValueChange={(value) =>
                        setValue('messageType', value as 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="IN_APP">In-App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template">Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Message</SelectItem>
                        <SelectItem value="bookingConfirmation">Booking Confirmation</SelectItem>
                        <SelectItem value="checkInReminder">Check-in Reminder</SelectItem>
                        <SelectItem value="paymentReminder">Payment Reminder</SelectItem>
                        <SelectItem value="maintenanceUpdate">Maintenance Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {messageType === 'EMAIL' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="recipientEmail">Recipient Email</Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        placeholder={
                          selectedBooking?.guestEmail ||
                          selectedTenant?.email ||
                          'Enter email address'
                        }
                        {...register('recipientEmail')}
                      />
                      {errors.recipientEmail && (
                        <p className="text-sm text-red-500">{errors.recipientEmail.message}</p>
                      )}
                      {(selectedBooking?.guestEmail || selectedTenant?.email) && (
                        <p className="text-muted-foreground text-xs">
                          Will use {selectedBooking?.guestEmail || selectedTenant?.email} if left
                          empty
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="Email subject" {...register('subject')} />
                    </div>
                  </>
                )}

                {(messageType === 'SMS' || messageType === 'WHATSAPP') && (
                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone">Recipient Phone</Label>
                    <Input
                      id="recipientPhone"
                      placeholder={
                        selectedBooking?.guestPhone || selectedTenant?.phone || 'Enter phone number'
                      }
                      {...register('recipientPhone')}
                    />
                    {(selectedBooking?.guestPhone || selectedTenant?.phone) && (
                      <p className="text-muted-foreground text-xs">
                        Will use {selectedBooking?.guestPhone || selectedTenant?.phone} if left
                        empty
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    rows={8}
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-500">{errors.message.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Recipient Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recipient</CardTitle>
                <CardDescription>Select a booking or tenant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bookingId">Booking</Label>
                  <Select
                    value={bookingId || ''}
                    onValueChange={(value) => {
                      setValue('bookingId', value);
                      if (value) setValue('tenantId', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a booking" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {bookings.map(
                        (booking: {
                          id: string;
                          guestName: string;
                          property?: { name: string };
                        }) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            {booking.guestName} - {booking.property?.name || 'No property'}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantId">Tenant</Label>
                  <Select
                    value={tenantId || ''}
                    onValueChange={(value) => {
                      setValue('tenantId', value);
                      if (value) setValue('bookingId', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {tenants.map(
                        (tenant: {
                          id: string;
                          firstName: string;
                          lastName: string;
                          email: string;
                        }) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.firstName} {tenant.lastName}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBooking && (
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <p className="font-medium">{selectedBooking.guestName}</p>
                    <p className="text-muted-foreground">{selectedBooking.guestEmail}</p>
                    {selectedBooking.guestPhone && (
                      <p className="text-muted-foreground">{selectedBooking.guestPhone}</p>
                    )}
                  </div>
                )}

                {selectedTenant && (
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <p className="font-medium">
                      {selectedTenant.firstName} {selectedTenant.lastName}
                    </p>
                    <p className="text-muted-foreground">{selectedTenant.email}</p>
                    {selectedTenant.phone && (
                      <p className="text-muted-foreground">{selectedTenant.phone}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={sendMessageMutation.isPending}>
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>

            {sendMessageMutation.isError && (
              <p className="text-sm text-red-500">
                {sendMessageMutation.error instanceof Error
                  ? sendMessageMutation.error.message
                  : 'Failed to send message'}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
