'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserTable, CreateUserDialog } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const { toast } = useToast();

  const fetchUsers = useCallback(
    async (page: number = currentPage) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', ITEMS_PER_PAGE.toString());
        if (search) params.append('search', search);
        if (tierFilter !== 'all') params.append('tier', tierFilter);
        if (statusFilter !== 'all') params.append('status', statusFilter);

        const response = await fetch(`/api/admin/users?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search, statusFilter, tierFilter, toast]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchUsers(1);
  }, [fetchUsers, search, tierFilter, statusFilter]);

  // Fetch when page changes
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAction = async (userId: string, action: string) => {
    if (action === 'activate' || action === 'deactivate') {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: action === 'activate' }),
        });

        if (!response.ok) {
          throw new Error('Failed to update user');
        }

        toast({
          title: 'Success',
          description: `User ${action === 'activate' ? 'activated' : 'deactivated'} successfully.`,
        });
        fetchUsers(currentPage);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to update user. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <span className="admin-kicker">Admin control</span>
              <div className="space-y-2">
                <h1 className="admin-page-title font-semibold">User Management</h1>
                <p className="admin-page-description">
                  Manage landlord accounts, subscription states, and account activity from one
                  operational workspace.
                </p>
              </div>
            </div>
            <CreateUserDialog onUserCreated={() => fetchUsers(1)} />
          </div>
        </div>
      </div>

      <Card className="admin-panel-muted admin-panel">
        <CardContent className="p-4">
          <div className="admin-toolbar">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/35" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="admin-input pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="admin-input w-full md:w-[200px]">
                <SelectValue placeholder="Subscription Tier" />
              </SelectTrigger>
              <SelectContent className="admin-dialog">
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="admin-input w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="admin-dialog">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAST_DUE">Past Due</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => fetchUsers(currentPage)}
              variant="outline"
              size="icon"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="admin-panel">
        <CardHeader>
          <CardTitle className="text-white">Users ({pagination.total})</CardTitle>
          <CardDescription className="text-white/60">
            All landlord accounts on the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-white/45" />
            </div>
          ) : (
            <>
              <UserTable users={users} onAction={handleAction} />
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                showFirstLast={pagination.totalPages > 5}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
