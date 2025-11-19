'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  User,
  Calendar,
  Trash2,
  Reply,
  AlertCircle,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/utils';

async function fetchMessage(id: string) {
  const response = await fetch(`/api/messages/${id}`);
  if (!response.ok) throw new Error('Failed to fetch message');
  return response.json();
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  SENT: 'bg-blue-100 text-blue-800 border-blue-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  READ: 'bg-purple-100 text-purple-800 border-purple-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
};

const messageTypeIcons: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-4 w-4" />,
  SMS: <Phone className="h-4 w-4" />,
  WHATSAPP: <MessageSquare className="h-4 w-4" />,
  IN_APP: <MessageSquare className="h-4 w-4" />,
};

const messageTypeLabels: Record<string, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  IN_APP: 'In-App',
};

export default function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: message,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['message', id],
    queryFn: () => fetchMessage(id),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      router.push('/messages');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Message Not Found"
          description="The message you're looking for doesn't exist"
        >
          <Link href="/messages">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Messages
            </Button>
          </Link>
        </PageHeader>
      </div>
    );
  }

  const isInbound = message.direction === 'INBOUND';
  const recipient = message.tenant
    ? `${message.tenant.firstName} ${message.tenant.lastName}`
    : message.booking?.guestName || message.recipientEmail || message.recipientPhone || 'Unknown';

  return (
    <div className="space-y-6">
      <PageHeader
        title={message.subject || 'No Subject'}
        description={`${isInbound ? 'From' : 'To'}: ${recipient}`}
      >
        <div className="flex gap-2">
          <Link href={`/messages/new?replyTo=${id}`}>
            <Button variant="outline">
              <Reply className="mr-2 h-4 w-4" />
              Reply
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Message</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this message? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Link href="/messages">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Message Content */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isInbound ? (
                    <ArrowDownLeft className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{message.subject || 'No Subject'}</CardTitle>
                    <CardDescription>
                      {isInbound ? 'Received' : 'Sent'} on {formatDate(message.createdAt)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {messageTypeIcons[message.messageType]}
                    {messageTypeLabels[message.messageType]}
                  </Badge>
                  <Badge className={statusColors[message.status]}>{message.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap">{message.message}</div>
              </div>
            </CardContent>
          </Card>

          {/* Thread Messages */}
          {message.threadMessages && message.threadMessages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conversation Thread</CardTitle>
                <CardDescription>
                  {message.threadMessages.length} other message(s) in this thread
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {message.threadMessages.map(
                    (threadMsg: {
                      id: string;
                      subject?: string | null;
                      message: string;
                      direction: string;
                      status: string;
                      createdAt: string;
                    }) => (
                      <Link
                        key={threadMsg.id}
                        href={`/messages/${threadMsg.id}`}
                        className="hover:bg-muted/50 block rounded-lg border p-4 transition-colors"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {threadMsg.direction === 'INBOUND' ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="font-medium">{threadMsg.subject || 'No Subject'}</span>
                          </div>
                          <Badge className={`${statusColors[threadMsg.status]} text-xs`}>
                            {threadMsg.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {threadMsg.message}
                        </p>
                        <p className="text-muted-foreground mt-2 text-xs">
                          {formatDate(threadMsg.createdAt)}
                        </p>
                      </Link>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground">Recipient:</span>
                <span className="font-medium">{recipient}</span>
              </div>

              {message.recipientEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span>{message.recipientEmail}</span>
                </div>
              )}

              {message.recipientPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <span>{message.recipientPhone}</span>
                </div>
              )}

              {message.booking?.property && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="text-muted-foreground h-4 w-4" />
                  <Link
                    href={`/properties/${message.booking.property.id}`}
                    className="text-primary hover:underline"
                  >
                    {message.booking.property.name}
                  </Link>
                </div>
              )}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(message.createdAt)}</span>
                </div>

                {message.sentAt && (
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Sent:</span>
                    <span>{formatDate(message.sentAt)}</span>
                  </div>
                )}

                {message.deliveredAt && (
                  <div className="flex items-center gap-2">
                    <Mail className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Delivered:</span>
                    <span>{formatDate(message.deliveredAt)}</span>
                  </div>
                )}

                {message.readAt && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Read:</span>
                    <span>{formatDate(message.readAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Related Booking/Tenant */}
          {message.booking && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/bookings/${message.booking.id}`}
                  className="hover:bg-muted/50 block rounded-lg border p-3 transition-colors"
                >
                  <p className="font-medium">{message.booking.guestName}</p>
                  {message.booking.property && (
                    <p className="text-muted-foreground text-sm">{message.booking.property.name}</p>
                  )}
                  {message.booking.checkIn && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDate(message.booking.checkIn)} - {formatDate(message.booking.checkOut)}
                    </p>
                  )}
                </Link>
              </CardContent>
            </Card>
          )}

          {message.tenant && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/tenants/${message.tenant.id}`}
                  className="hover:bg-muted/50 block rounded-lg border p-3 transition-colors"
                >
                  <p className="font-medium">
                    {message.tenant.firstName} {message.tenant.lastName}
                  </p>
                  <p className="text-muted-foreground text-sm">{message.tenant.email}</p>
                  {message.tenant.phone && (
                    <p className="text-muted-foreground text-xs">{message.tenant.phone}</p>
                  )}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
