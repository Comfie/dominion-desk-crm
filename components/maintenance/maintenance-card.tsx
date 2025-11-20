import Link from 'next/link';
import { MoreVertical, Eye, Trash2, Home, Calendar, User, Wrench, DollarSign } from 'lucide-react';

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
import { formatDate, formatCurrency, formatRelativeTime } from '@/lib/utils';

interface MaintenanceCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    scheduledDate: string | null;
    estimatedCost: number | null;
    actualCost: number | null;
    assignedTo: string | null;
    createdAt: string;
    property: {
      id: string;
      name: string;
      city: string;
    };
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
  onDelete?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  HVAC: 'HVAC',
  APPLIANCE: 'Appliance',
  STRUCTURAL: 'Structural',
  PAINTING: 'Painting',
  CLEANING: 'Cleaning',
  LANDSCAPING: 'Landscaping',
  PEST_CONTROL: 'Pest Control',
  SECURITY: 'Security',
  OTHER: 'Other',
};

export function MaintenanceCard({ request, onDelete }: MaintenanceCardProps) {
  const truncatedDescription =
    request.description.length > 100
      ? `${request.description.substring(0, 100)}...`
      : request.description;

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with status and priority */}
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusColors[request.status] || statusColors.PENDING}>
                {request.status.replace('_', ' ')}
              </Badge>
              {request.priority !== 'NORMAL' && (
                <Badge variant="outline" className={priorityColors[request.priority]}>
                  {request.priority}
                </Badge>
              )}
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
                  <Link href={`/maintenance/${request.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(request.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title and category */}
          <div>
            <Link
              href={`/maintenance/${request.id}`}
              className="hover:text-primary text-lg font-semibold transition-colors"
            >
              {request.title}
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <Wrench className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                {categoryLabels[request.category]}
              </span>
            </div>
          </div>

          {/* Description preview */}
          <p className="text-muted-foreground text-sm">{truncatedDescription}</p>

          {/* Details */}
          <div className="text-muted-foreground space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <Link
                href={`/properties/${request.property.id}`}
                className="hover:text-primary transition-colors"
              >
                {request.property.name}
              </Link>
            </div>

            {request.tenant && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  Reported by {request.tenant.firstName} {request.tenant.lastName}
                </span>
              </div>
            )}

            {request.scheduledDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Scheduled: {formatDate(request.scheduledDate)}</span>
              </div>
            )}

            {request.assignedTo && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Assigned to: {request.assignedTo}</span>
              </div>
            )}

            {(request.estimatedCost || request.actualCost) && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>
                  {request.actualCost
                    ? `Cost: ${formatCurrency(request.actualCost)}`
                    : `Est: ${formatCurrency(request.estimatedCost!)}`}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground text-xs">
              {formatRelativeTime(request.createdAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
