import Link from 'next/link';
import { User, Phone, Mail, MoreVertical, Eye, Edit, Trash2, Home, Briefcase } from 'lucide-react';

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

interface TenantCardProps {
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    tenantType: string;
    status: string;
    employmentStatus: string | null;
    properties: Array<{
      property: {
        id: string;
        name: string;
        city: string;
      };
    }>;
    _count: {
      bookings: number;
      payments: number;
    };
  };
  onDelete?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  BLACKLISTED: 'bg-red-100 text-red-800 border-red-200',
};

const typeLabels: Record<string, string> = {
  GUEST: 'Guest',
  TENANT: 'Tenant',
  BOTH: 'Guest & Tenant',
};

const employmentLabels: Record<string, string> = {
  EMPLOYED: 'Employed',
  SELF_EMPLOYED: 'Self-Employed',
  UNEMPLOYED: 'Unemployed',
  RETIRED: 'Retired',
  STUDENT: 'Student',
};

export function TenantCard({ tenant, onDelete }: TenantCardProps) {
  const fullName = `${tenant.firstName} ${tenant.lastName}`;

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with status and actions */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[tenant.status] || statusColors.ACTIVE}>
                  {tenant.status}
                </Badge>
                <Badge variant="outline">{typeLabels[tenant.tenantType]}</Badge>
              </div>
              <Link
                href={`/tenants/${tenant.id}`}
                className="hover:text-primary text-lg font-semibold transition-colors"
              >
                {fullName}
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
                  <Link href={`/tenants/${tenant.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/tenants/${tenant.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(tenant.id)}
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
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{tenant.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              <span>{tenant.phone}</span>
            </div>
          </div>

          {/* Employment */}
          {tenant.employmentStatus && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4" />
              <span>{employmentLabels[tenant.employmentStatus]}</span>
            </div>
          )}

          {/* Properties */}
          {tenant.properties.length > 0 && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Home className="h-4 w-4" />
              <span className="truncate">
                {tenant.properties.map((p) => p.property.name).join(', ')}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <span>{tenant._count.bookings} bookings</span>
              <span>{tenant._count.payments} payments</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
