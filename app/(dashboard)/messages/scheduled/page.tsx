'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, Mail, Send, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface ScheduledMessage {
  id: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  recipientName: string | null;
  messageType: string;
  subject: string | null;
  body: string;
  scheduledFor: Date | string;
  sentAt: Date | string | null;
  status: string;
  automation: {
    id: string;
    name: string;
  } | null;
  booking: {
    id: string;
    property: {
      name: string;
    };
  } | null;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

const statusConfig: Record<string, { label: string; variant: any; icon: any; className: string }> =
  {
    PENDING: {
      label: 'Pending',
      variant: 'secondary',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800',
    },
    SENDING: {
      label: 'Sending',
      variant: 'default',
      icon: Send,
      className: 'bg-blue-100 text-blue-800',
    },
    SENT: {
      label: 'Sent',
      variant: 'default',
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-800',
    },
    DELIVERED: {
      label: 'Delivered',
      variant: 'default',
      icon: CheckCircle2,
      className: 'bg-green-600 text-white',
    },
    FAILED: {
      label: 'Failed',
      variant: 'destructive',
      icon: XCircle,
      className: 'bg-red-100 text-red-800',
    },
    CANCELLED: {
      label: 'Cancelled',
      variant: 'secondary',
      icon: XCircle,
      className: 'bg-gray-100 text-gray-800',
    },
  };

export default function ScheduledMessagesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {
    data: messages,
    isLoading,
    error,
  } = useQuery<ScheduledMessage[]>({
    queryKey: ['scheduled-messages', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/messaging/scheduled?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch scheduled messages');
      }
      return res.json();
    },
  });

  const stats = messages
    ? {
        total: messages.length,
        pending: messages.filter((m) => m.status === 'PENDING').length,
        sent: messages.filter((m) => m.status === 'SENT' || m.status === 'DELIVERED').length,
        failed: messages.filter((m) => m.status === 'FAILED').length,
      }
    : { total: 0, pending: 0, sent: 0, failed: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduled Messages"
        description="View and manage your message queue"
        icon={Clock}
      />

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-muted-foreground text-sm">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-muted-foreground text-sm">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
              <div className="text-muted-foreground text-sm">Sent</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-muted-foreground text-sm">Failed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Message Queue</h3>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {!isLoading && messages && messages.length === 0 && (
            <div className="py-12 text-center">
              <Clock className="text-muted-foreground mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No scheduled messages</h3>
              <p className="text-muted-foreground mt-2">
                Messages will appear here when automations are triggered.
              </p>
            </div>
          )}

          {!isLoading && messages && messages.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Automation</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => {
                    const config = statusConfig[message.status] || statusConfig.PENDING;
                    const StatusIcon = config.icon;

                    return (
                      <TableRow key={message.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{message.recipientName || 'N/A'}</div>
                            <div className="text-muted-foreground text-sm">
                              {message.recipientEmail || message.recipientPhone || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{message.messageType}</Badge>
                        </TableCell>
                        <TableCell>
                          {message.automation?.name || 'Manual'}
                          {message.booking && (
                            <div className="text-muted-foreground text-xs">
                              {message.booking.property.name}
                            </div>
                          )}
                          {message.tenant && (
                            <div className="text-muted-foreground text-xs">
                              {message.tenant.firstName} {message.tenant.lastName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(message.scheduledFor).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={config.className}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {message.sentAt ? (
                            <div className="text-sm">
                              {new Date(message.sentAt).toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
