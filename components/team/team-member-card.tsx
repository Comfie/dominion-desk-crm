'use client';

import { Mail, MoreVertical, Edit, Trash2, Send, Shield, User } from 'lucide-react';
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

interface TeamMemberCardProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
    canManageProperties: boolean;
    canManageBookings: boolean;
    canManageTenants: boolean;
    canManageFinancials: boolean;
    canViewReports: boolean;
    invitedAt: Date | string;
    acceptedAt: Date | string | null;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onResend?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  DECLINED: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  MANAGER: 'bg-cyan-100 text-cyan-800',
  VIEWER: 'bg-gray-100 text-gray-800',
};

const roleIcons: Record<string, any> = {
  OWNER: Shield,
  ADMIN: Shield,
  MANAGER: User,
  VIEWER: User,
};

export function TeamMemberCard({ member, onEdit, onDelete, onResend }: TeamMemberCardProps) {
  const fullName = `${member.firstName} ${member.lastName}`;
  const RoleIcon = roleIcons[member.role] || User;

  const permissions = [
    member.canManageProperties && 'Properties',
    member.canManageBookings && 'Bookings',
    member.canManageTenants && 'Tenants',
    member.canManageFinancials && 'Financials',
    member.canViewReports && 'Reports',
  ].filter((permission): permission is string => Boolean(permission));

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with status and actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusColors[member.status] || statusColors.PENDING}>
                  {member.status}
                </Badge>
                <Badge className={roleColors[member.role]} variant="outline">
                  <RoleIcon className="mr-1 h-3 w-3" />
                  {member.role}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold">{fullName}</h3>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(member.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Permissions
                  </DropdownMenuItem>
                )}
                {onResend && member.status === 'PENDING' && (
                  <DropdownMenuItem onClick={() => onResend(member.id)}>
                    <Send className="mr-2 h-4 w-4" />
                    Resend Invitation
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(member.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Member
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Contact Info */}
          <div className="text-muted-foreground space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{member.email}</span>
            </div>
          </div>

          {/* Permissions */}
          {permissions.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">Permissions:</p>
              <div className="flex flex-wrap gap-1">
                {permissions.map((permission) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="text-muted-foreground flex items-center justify-between border-t pt-2 text-xs">
            <span>Invited: {new Date(member.invitedAt).toLocaleDateString()}</span>
            {member.acceptedAt && (
              <span>Accepted: {new Date(member.acceptedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
