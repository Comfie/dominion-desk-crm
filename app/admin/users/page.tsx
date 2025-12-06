'use client';

import { useEffect, useState } from 'react';
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tierFilter !== 'all') params.append('tier', tierFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
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
  };

  useEffect(() => {
    fetchUsers();
  }, [search, tierFilter, statusFilter]);

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
        fetchUsers();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update user. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage landlords and their subscriptions</p>
        </div>
        <CreateUserDialog onUserCreated={fetchUsers} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Subscription Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAST_DUE">Past Due</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchUsers} variant="outline" size="icon">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>All landlord accounts on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : (
            <UserTable users={users} onAction={handleAction} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
