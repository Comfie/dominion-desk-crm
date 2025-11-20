import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Bed, Bath, Car, MoreVertical, Edit, Trash2, Eye, Home } from 'lucide-react';

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
import { formatCurrency } from '@/lib/utils';

interface PropertyCardProps {
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    province: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    parkingSpaces: number;
    monthlyRent: number | null;
    dailyRate: number | null;
    rentalType: string;
    status: string;
    primaryImageUrl: string | null;
    isAvailable: boolean;
    _count?: {
      bookings: number;
      tenants: number;
    };
  };
  onDelete?: (id: string) => void;
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

export function PropertyCard({ property, onDelete }: PropertyCardProps) {
  const displayPrice =
    property.rentalType === 'SHORT_TERM' || property.rentalType === 'BOTH'
      ? property.dailyRate
      : property.monthlyRent;

  const priceLabel =
    property.rentalType === 'SHORT_TERM' || property.rentalType === 'BOTH' ? '/night' : '/month';

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {/* Image */}
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        {property.primaryImageUrl ? (
          <Image
            src={property.primaryImageUrl}
            alt={property.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Home className="text-muted-foreground/50 h-12 w-12" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={statusColors[property.status] || statusColors.ACTIVE}>
            {property.status}
          </Badge>
        </div>

        {/* Actions Menu */}
        <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/properties/${property.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/properties/${property.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(property.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title & Type */}
          <div>
            <Link
              href={`/properties/${property.id}`}
              className="hover:text-primary line-clamp-1 font-semibold transition-colors"
            >
              {property.name}
            </Link>
            <p className="text-muted-foreground text-sm">
              {propertyTypeLabels[property.propertyType] || property.propertyType}
            </p>
          </div>

          {/* Location */}
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {property.city}, {property.province}
            </span>
          </div>

          {/* Features */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Bed className="text-muted-foreground h-4 w-4" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="text-muted-foreground h-4 w-4" />
              <span>{property.bathrooms}</span>
            </div>
            {property.parkingSpaces > 0 && (
              <div className="flex items-center gap-1">
                <Car className="text-muted-foreground h-4 w-4" />
                <span>{property.parkingSpaces}</span>
              </div>
            )}
          </div>

          {/* Price & Stats */}
          <div className="flex items-center justify-between border-t pt-2">
            <div>
              {displayPrice ? (
                <p className="text-lg font-semibold">
                  {formatCurrency(Number(displayPrice))}
                  <span className="text-muted-foreground text-sm font-normal">{priceLabel}</span>
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">Price not set</p>
              )}
            </div>
            {property._count && (
              <div className="text-muted-foreground text-xs">
                {property._count.bookings} bookings
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
