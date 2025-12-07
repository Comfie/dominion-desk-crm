'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { TenantCard } from '@/components/tenants/tenant-card';

async function fetchTenants(filters: Record<string, string>, page = 1) {
  const params = new URLSearchParams({ ...filters, page: page.toString() });
  const response = await fetch(`/api/tenants?${params}`);
  if (!response.ok) throw new Error('Failed to fetch tenants');
  return response.json();
}

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', { search, status: statusFilter, type: typeFilter, page }],
    queryFn: () =>
      fetchTenants(
        {
          ...(search && { search }),
          ...(statusFilter && { status: statusFilter }),
          ...(typeFilter && { type: typeFilter }),
        },
        page
      ),
  });

  const tenants = data?.data || [];
  const pagination = data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tenants/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this tenant?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tenants" description="Manage your tenants and guests">
        <Button asChild>
          <Link href="/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All Types</option>
            <option value="GUEST">Guest</option>
            <option value="TENANT">Tenant</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
      </div>

      {/* Tenants Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-lg" />
          ))}
        </div>
      ) : tenants.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map(
              (tenant: {
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
              }) => (
                <TenantCard key={tenant.id} tenant={tenant} onDelete={handleDelete} />
              )
            )}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Users className="text-muted-foreground/50 h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No tenants found</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            {search || statusFilter || typeFilter
              ? 'Try adjusting your filters'
              : 'Get started by adding your first tenant'}
          </p>
          {!search && !statusFilter && !typeFilter && (
            <Button asChild className="mt-4">
              <Link href="/tenants/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
