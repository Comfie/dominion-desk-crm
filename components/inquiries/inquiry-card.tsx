import Link from 'next/link';
import {
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Trash2,
  Home,
  Calendar,
  Users,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface InquiryCardProps {
  inquiry: {
    id: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string | null;
    message: string;
    inquirySource: string;
    inquiryType: string;
    status: string;
    priority: string;
    checkInDate: string | null;
    checkOutDate: string | null;
    numberOfGuests: number | null;
    createdAt: string;
    property: {
      id: string;
      name: string;
      city: string;
    } | null;
  };
  onDelete?: (id: string) => void;
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
  BOOKING: 'Booking',
  VIEWING: 'Viewing',
  GENERAL: 'General',
  COMPLAINT: 'Complaint',
  MAINTENANCE: 'Maintenance',
};

export function InquiryCard({ inquiry, onDelete }: InquiryCardProps) {
  const truncatedMessage =
    inquiry.message.length > 120 ? `${inquiry.message.substring(0, 120)}...` : inquiry.message;

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with status and priority */}
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusColors[inquiry.status] || statusColors.NEW}>
                {inquiry.status.replace('_', ' ')}
              </Badge>
              {inquiry.priority !== 'NORMAL' && (
                <Badge variant="outline" className={priorityColors[inquiry.priority]}>
                  {inquiry.priority}
                </Badge>
              )}
              <Badge variant="outline">{sourceLabels[inquiry.inquirySource]}</Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/inquiries/${inquiry.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(inquiry.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Contact info */}
          <div>
            <Link
              href={`/inquiries/${inquiry.id}`}
              className="hover:text-primary text-lg font-semibold transition-colors"
            >
              {inquiry.contactName}
            </Link>
            <div className="text-muted-foreground mt-1 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{inquiry.contactEmail}</span>
              </div>
              {inquiry.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{inquiry.contactPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Message preview */}
          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="text-muted-foreground text-sm">{truncatedMessage}</p>
            </div>
          </div>

          {/* Property and booking details */}
          <div className="text-muted-foreground space-y-1 text-sm">
            {inquiry.property && (
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <Link
                  href={`/properties/${inquiry.property.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {inquiry.property.name}
                </Link>
              </div>
            )}

            {inquiry.checkInDate && inquiry.checkOutDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(inquiry.checkInDate)} - {formatDate(inquiry.checkOutDate)}
                </span>
              </div>
            )}

            {inquiry.numberOfGuests && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  {inquiry.numberOfGuests} {inquiry.numberOfGuests === 1 ? 'guest' : 'guests'}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-3">
            <Badge variant="secondary" className="text-xs">
              {typeLabels[inquiry.inquiryType]}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {formatRelativeTime(inquiry.createdAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
