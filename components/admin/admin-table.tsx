'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLogin?: string | null;
  isActive: boolean;
}

interface AdminTableProps {
  admins: Admin[];
  onAction: (adminId: string, action: string) => void;
}

export function AdminTable({ admins, onAction }: AdminTableProps) {
  if (admins.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-center">
        <p>No admin users found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell className="font-medium">
                {admin.firstName} {admin.lastName}
              </TableCell>
              <TableCell>{admin.email}</TableCell>
              <TableCell>{format(new Date(admin.createdAt), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                {admin.lastLogin ? format(new Date(admin.lastLogin), 'MMM d, yyyy HH:mm') : 'Never'}
              </TableCell>
              <TableCell>
                {admin.isActive ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {admin.isActive ? (
                      <DropdownMenuItem onClick={() => onAction(admin.id, 'deactivate')}>
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onAction(admin.id, 'activate')}>
                        Activate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
