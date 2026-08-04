import Link from 'next/link';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface PropertyTableProps {
  properties: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    province: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    monthlyRent: number | null;
    dailyRate: number | null;
    rentalType: string;
    status: string;
    isOccupied?: boolean;
    occupiedTenantCount?: number;
    isReserved?: boolean;
    reservedTenantCount?: number;
  }>;
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

export function PropertyTable({ properties, onDelete }: PropertyTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Beds / Baths</TableHead>
          <TableHead>Rent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Occupancy</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map((property) => {
          const displayPrice =
            property.rentalType === 'SHORT_TERM' || property.rentalType === 'BOTH'
              ? property.dailyRate
              : property.monthlyRent;
          const priceLabel =
            property.rentalType === 'SHORT_TERM' || property.rentalType === 'BOTH'
              ? '/night'
              : '/month';
          const occupiedCount = property.occupiedTenantCount ?? 0;
          const isOccupied = property.isOccupied ?? occupiedCount > 0;
          const reservedCount = property.reservedTenantCount ?? 0;
          const isReserved = property.isReserved ?? reservedCount > 0;

          return (
            <TableRow key={property.id}>
              <TableCell className="font-medium">
                <Link href={`/properties/${property.id}`} className="hover:text-primary">
                  {property.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {property.city}, {property.province}
              </TableCell>
              <TableCell className="text-sm">
                {propertyTypeLabels[property.propertyType] || property.propertyType}
              </TableCell>
              <TableCell className="text-sm">
                {property.bedrooms} bed / {property.bathrooms} bath
              </TableCell>
              <TableCell className="text-sm">
                {displayPrice ? (
                  <>
                    {formatCurrency(Number(displayPrice))}
                    <span className="text-muted-foreground">{priceLabel}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[property.status] || statusColors.ACTIVE}>
                  {property.status}
                </Badge>
              </TableCell>
              <TableCell>
                {isOccupied ? (
                  <Badge className="border-red-200 bg-red-100 text-red-800">
                    Occupied{occupiedCount > 1 ? ` · ${occupiedCount}` : ''}
                  </Badge>
                ) : isReserved ? (
                  <Badge className="border-orange-200 bg-orange-100 text-orange-800">
                    Reserved{reservedCount > 1 ? ` · ${reservedCount}` : ''}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Vacant</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
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
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
