'use client';

import Link from 'next/link';
import {
  Mail,
  MessageSquare,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  User,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface MessageCardProps {
  message: {
    id: string;
    subject?: string | null;
    message: string;
    messageType: string;
    direction: string;
    recipientEmail?: string | null;
    recipientPhone?: string | null;
    status: string;
    createdAt: string;
    booking?: {
      id: string;
      guestName: string;
      property?: {
        id: string;
        name: string;
      } | null;
    } | null;
    tenant?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  };
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

export function MessageCard({ message }: MessageCardProps) {
  const recipient = message.tenant
    ? `${message.tenant.firstName} ${message.tenant.lastName}`
    : message.booking?.guestName || message.recipientEmail || message.recipientPhone || 'Unknown';

  const propertyName = message.booking?.property?.name;
  const isInbound = message.direction === 'INBOUND';
  const preview =
    message.message.length > 100 ? message.message.substring(0, 100) + '...' : message.message;

  return (
    <Link href={`/messages/${message.id}`}>
      <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {isInbound ? (
                  <ArrowDownLeft className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                )}
                <h3 className="font-semibold">{message.subject || 'No Subject'}</h3>
                <Badge variant="outline" className="text-xs">
                  {messageTypeLabels[message.messageType] || message.messageType}
                </Badge>
              </div>

              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{recipient}</span>
                </div>
                {propertyName && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{propertyName}</span>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground text-sm">{preview}</p>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                {messageTypeIcons[message.messageType]}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{formatDate(message.createdAt)}</p>
              <Badge className={`${statusColors[message.status]} mt-1`}>{message.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
