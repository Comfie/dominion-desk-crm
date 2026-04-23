'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
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
    <div className="admin-table-shell">
      <Table>
        <TableHeader>
          <TableRow className="border-white/8 hover:bg-transparent">
            <TableHead className="w-[220px] text-white/55">User</TableHead>
            <TableHead className="text-white/55">Subscription</TableHead>
            <TableHead className="text-white/55">Status</TableHead>
            <TableHead className="w-[140px] text-white/55">Properties</TableHead>
            <TableHead className="w-[100px] text-white/55">Joined</TableHead>
            <TableHead className="text-right text-white/55">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow className="border-white/8">
              <TableCell colSpan={6} className="text-center text-white/50">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="border-white/8 hover:bg-white/[0.025]">
                <TableCell className="font-medium text-white">
                  <div>
                    <div className="font-medium text-white">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="max-w-[200px] truncate text-sm text-white/55">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <SubscriptionTierBadge tier={user.subscriptionTier as SubscriptionTier} />
                </TableCell>
                <TableCell>
                  <SubscriptionStatusBadge status={user.subscriptionStatus as SubscriptionStatus} />
                </TableCell>
                <TableCell>
                  <div className="text-sm text-white/78">
                    <div>{user.propertiesCount} properties</div>
                    <div className="text-white/50">{user.tenantsCount} tenants</div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-white/55">
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/70 hover:bg-white/5 hover:text-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="admin-dialog">
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
