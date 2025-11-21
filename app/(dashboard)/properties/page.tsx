'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Grid3X3, List, Building2 } from 'lucide-react';

import { PageHeader, EmptyState } from '@/components/shared';
import { PropertyCard } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

async function fetchProperties(search?: string, status?: string, type?: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  if (type) params.set('type', type);

  const response = await fetch(`/api/properties?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch properties');
  return response.json();
}

async function deleteProperty(id: string) {
  const response = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete property');
  return response.json();
}

export default function PropertiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties', search, statusFilter, typeFilter],
    queryFn: () => fetchProperties(search, statusFilter.join(','), typeFilter.join(',')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setTypeFilter([]);
  };

  const hasActiveFilters = statusFilter.length > 0 || typeFilter.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Properties" description="Manage your rental properties">
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </PageHeader>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="bg-primary absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-medium text-white">
                    {statusFilter.length + typeFilter.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('ACTIVE')}
                onCheckedChange={() => toggleStatusFilter('ACTIVE')}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('INACTIVE')}
                onCheckedChange={() => toggleStatusFilter('INACTIVE')}
              >
                Inactive
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('MAINTENANCE')}
                onCheckedChange={() => toggleStatusFilter('MAINTENANCE')}
              >
                Maintenance
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Rental Type</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes('SHORT_TERM')}
                onCheckedChange={() => toggleTypeFilter('SHORT_TERM')}
              >
                Short-term
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes('LONG_TERM')}
                onCheckedChange={() => toggleTypeFilter('LONG_TERM')}
              >
                Long-term
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter.includes('BOTH')}
                onCheckedChange={() => toggleTypeFilter('BOTH')}
              >
                Both
              </DropdownMenuCheckboxItem>
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <Button variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Properties Display */}
      {isLoading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'space-y-4'
          }
        >
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : properties?.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add your first property to start managing your rentals"
        >
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        </EmptyState>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties?.map((property: Parameters<typeof PropertyCard>[0]['property']) => (
            <PropertyCard key={property.id} property={property} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {properties?.map((property: Parameters<typeof PropertyCard>[0]['property']) => (
            <PropertyCard
              key={property.id}
              property={property}
              onDelete={handleDelete}
              variant="list"
            />
          ))}
        </div>
      )}
    </div>
  );
}
