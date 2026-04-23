'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminTable, CreateAdminDialog } from '@/components/admin';
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

interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLogin?: string | null;
  isActive: boolean;
}

export default function SystemAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/system-admins?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }
      const data = await response.json();
      setAdmins(data.admins);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAction = async (adminId: string, action: string) => {
    if (action === 'activate' || action === 'deactivate') {
      try {
        const response = await fetch(`/api/admin/system-admins/${adminId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: action === 'activate' }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update admin');
        }

        toast({
          title: 'Success',
          description: `Admin ${action === 'activate' ? 'activated' : 'deactivated'} successfully.`,
        });
        fetchAdmins();
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to update admin. Please try again.',
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
              <span className="admin-kicker">Access control</span>
              <div className="space-y-2">
                <h1 className="admin-page-title font-semibold">System Admins</h1>
                <p className="admin-page-description">
                  Manage platform administrator accounts, review access state, and provision new
                  admin users.
                </p>
              </div>
            </div>
            <CreateAdminDialog onAdminCreated={fetchAdmins} />
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="admin-input w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="admin-dialog">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchAdmins}
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
          <CardTitle className="text-white">Administrators ({admins.length})</CardTitle>
          <CardDescription className="text-white/60">
            All system administrator accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-white/45" />
            </div>
          ) : (
            <AdminTable admins={admins} onAction={handleAction} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
