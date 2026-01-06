'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SubscriptionTierBadge, SubscriptionStatusBadge } from './subscription-badge';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: string;
  lastLogin?: string | null;
  isActive: boolean;
  mrr: number;
  propertiesCount: number;
  bookingsCount: number;
  tenantsCount: number;
}

interface UserTableProps {
  users: User[];
  onAction?: (userId: string, action: string) => void;
}

export function UserTable({ users, onAction }: UserTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">User</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[140px]">Properties</TableHead>
            <TableHead className="w-[100px]">Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-muted-foreground max-w-[200px] truncate text-sm">
                      {user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <SubscriptionTierBadge tier={user.subscriptionTier as any} />
                </TableCell>
                <TableCell>
                  <SubscriptionStatusBadge status={user.subscriptionStatus as any} />
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{user.propertiesCount} properties</div>
                    <div className="text-muted-foreground">{user.tenantsCount} tenants</div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}?action=edit`}>Edit Subscription</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onAction?.(user.id, user.isActive ? 'deactivate' : 'activate')
                        }
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
