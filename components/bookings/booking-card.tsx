import Link from 'next/link';
import { Calendar, User, Phone, Mail, MoreVertical, Eye, Edit, Trash2, Home } from 'lucide-react';

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
import { formatCurrency, formatDate } from '@/lib/utils';

interface BookingCardProps {
  booking: {
    id: string;
    guestName: string;
    guestEmail: string | null;
    guestPhone: string | null;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    totalAmount: number;
    status: string;
    source: string;
    property: {
      id: string;
      name: string;
      address: string;
      city: string;
      primaryImageUrl: string | null;
    };
  };
  onDelete?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  CHECKED_IN: 'bg-green-100 text-green-800 border-green-200',
  CHECKED_OUT: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  NO_SHOW: 'bg-purple-100 text-purple-800 border-purple-200',
};

const sourceLabels: Record<string, string> = {
  DIRECT: 'Direct',
  AIRBNB: 'Airbnb',
  BOOKING_COM: 'Booking.com',
  VRBO: 'VRBO',
  OTHER: 'Other',
};

export function BookingCard({ booking, onDelete }: BookingCardProps) {
  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with status and actions */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[booking.status] || statusColors.PENDING}>
                  {booking.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">{sourceLabels[booking.source]}</Badge>
              </div>
              <Link
                href={`/bookings/${booking.id}`}
                className="hover:text-primary text-lg font-semibold transition-colors"
              >
                {booking.guestName}
              </Link>
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
                  <Link href={`/bookings/${booking.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/bookings/${booking.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(booking.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Contact info */}
          <div className="text-muted-foreground space-y-1 text-sm">
            {booking.guestEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{booking.guestEmail}</span>
              </div>
            )}
            {booking.guestPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <span>{booking.guestPhone}</span>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span>
              {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
            </span>
            <Badge variant="secondary" className="ml-auto">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </Badge>
          </div>

          {/* Property */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Home className="h-4 w-4" />
            <Link
              href={`/properties/${booking.property.id}`}
              className="hover:text-primary truncate transition-colors"
            >
              {booking.property.name}
            </Link>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>
                {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}
              </span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(Number(booking.totalAmount))}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
