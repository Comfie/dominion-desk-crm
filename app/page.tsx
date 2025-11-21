'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Bed,
  Bath,
  MapPin,
  Search,
  ArrowRight,
  Sparkles,
  BookOpen,
  Grid3x3,
  List,
  Filter,
  X,
  Home,
  Car,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/utils';

interface Property {
  id: string;
  name: string;
  propertyType: string;
  address: string;
  city: string;
  province: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces?: number;
  monthlyRent: number | null;
  dailyRate: number | null;
  primaryImageUrl: string | null;
  rentalType: string;
}

const propertyTypes = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'COTTAGE', label: 'Cottage' },
  { value: 'ROOM', label: 'Room' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'OTHER', label: 'Other' },
];

const rentalTypes = [
  { value: 'LONG_TERM', label: 'Long Term' },
  { value: 'SHORT_TERM', label: 'Short Term' },
  { value: 'BOTH', label: 'Both' },
];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);

  // Filters
  const [propertyType, setPropertyType] = useState<string>('');
  const [rentalType, setRentalType] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [bedroomsFilter, setBedroomsFilter] = useState<string>('');

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: [
      'public-properties',
      search,
      propertyType,
      rentalType,
      minPrice,
      maxPrice,
      bedroomsFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('city', search);
      if (propertyType) params.set('type', propertyType);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (bedroomsFilter) params.set('bedrooms', bedroomsFilter);
      const response = await fetch(`/api/public/properties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  const hasActiveFilters = propertyType || rentalType || minPrice || maxPrice || bedroomsFilter;

  const clearFilters = () => {
    setPropertyType('');
    setRentalType('');
    setMinPrice('');
    setMaxPrice('');
    setBedroomsFilter('');
  };

  const filteredProperties = properties?.filter((property) => {
    if (rentalType && property.rentalType !== rentalType) return false;
    return true;
  });

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Property Type */}
      <div>
        <label className="mb-2 block text-sm font-medium">Property Type</label>
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {propertyTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rental Type */}
      <div>
        <label className="mb-2 block text-sm font-medium">Rental Type</label>
        <Select value={rentalType} onValueChange={setRentalType}>
          <SelectTrigger>
            <SelectValue placeholder="All Rentals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rentals</SelectItem>
            {rentalTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="mb-2 block text-sm font-medium">Minimum Bedrooms</label>
        <Select value={bedroomsFilter} onValueChange={setBedroomsFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="1">1+</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
            <SelectItem value="5">5+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="mb-2 block text-sm font-medium">Price Range</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/80 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="hidden text-lg font-semibold sm:inline">Property CRM</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-slate-800"
              asChild
            >
              <Link href="/pitch">
                <Sparkles className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Pitch</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              asChild
            >
              <Link href="/docs">
                <BookOpen className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Docs</span>
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/portal/login">Tenant Login</Link>
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              asChild
            >
              <Link href="/login">
                <span className="hidden sm:inline">Manager Login</span>
                <span className="sm:hidden">Login</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-16 text-white sm:py-20 lg:py-24">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white blur-3xl" />
          <div className="absolute top-40 -right-20 h-80 w-80 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
            Find Your Perfect Rental
          </h1>
          <p className="mb-8 text-base text-blue-100 sm:text-lg lg:text-xl">
            Browse available properties across South Africa
          </p>

          {/* Search */}
          <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 bg-white pl-10 text-slate-900 shadow-lg"
              />
            </div>
            <Button size="lg" className="h-12 bg-white text-blue-600 shadow-lg hover:bg-slate-50">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Filters and View Toggle */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-100">
              Available Properties
            </h2>
            {filteredProperties && (
              <Badge variant="secondary" className="text-sm">
                {filteredProperties.length} found
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Button */}
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative sm:hidden">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                      {
                        [propertyType, rentalType, minPrice, maxPrice, bedroomsFilter].filter(
                          Boolean
                        ).length
                      }
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filter Properties</SheetTitle>
                  <SheetDescription>
                    Refine your search to find the perfect property
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Filters */}
            <div className="hidden items-center gap-2 sm:flex">
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={bedroomsFilter} onValueChange={setBedroomsFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Properties Grid/List */}
        {isLoading ? (
          <div
            className={
              viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'
            }
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProperties && filteredProperties.length > 0 ? (
          <div
            className={
              viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'
            }
          >
            {filteredProperties.map((property) => {
              const displayPrice =
                property.rentalType === 'SHORT_TERM' || property.rentalType === 'BOTH'
                  ? property.dailyRate
                  : property.monthlyRent;
              const priceLabel =
                property.rentalType === 'SHORT_TERM' || property.rentalType === 'BOTH'
                  ? '/night'
                  : '/month';

              if (viewMode === 'list') {
                return (
                  <Link key={property.id} href={`/p/${property.id}`}>
                    <Card className="group overflow-hidden transition-all hover:shadow-xl">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Image */}
                          <div className="relative aspect-[4/3] w-full bg-slate-200 sm:w-64 sm:shrink-0 dark:bg-slate-700">
                            {property.primaryImageUrl ? (
                              <Image
                                src={property.primaryImageUrl}
                                alt={property.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Home className="h-12 w-12 text-slate-400" />
                              </div>
                            )}
                            <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900 backdrop-blur-sm">
                              {property.propertyType}
                            </Badge>
                          </div>

                          {/* Content */}
                          <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
                            <div>
                              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {property.name}
                              </h3>
                              <div className="mb-3 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {property.address}, {property.city}, {property.province}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Bed className="h-4 w-4" />
                                  <span>{property.bedrooms} bed</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Bath className="h-4 w-4" />
                                  <span>{property.bathrooms} bath</span>
                                </div>
                                {property.parkingSpaces && property.parkingSpaces > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Car className="h-4 w-4" />
                                    <span>{property.parkingSpaces} parking</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t pt-4 dark:border-slate-700">
                              <div>
                                {displayPrice ? (
                                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(Number(displayPrice))}
                                    <span className="text-sm font-normal text-slate-500">
                                      {priceLabel}
                                    </span>
                                  </p>
                                ) : (
                                  <p className="text-sm text-slate-500">Price on request</p>
                                )}
                              </div>
                              <Button size="sm" className="gap-1">
                                View Details
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              }

              return (
                <Link key={property.id} href={`/p/${property.id}`}>
                  <Card className="group overflow-hidden transition-all hover:shadow-xl">
                    <div className="relative aspect-[4/3] bg-slate-200 dark:bg-slate-700">
                      {property.primaryImageUrl ? (
                        <Image
                          src={property.primaryImageUrl}
                          alt={property.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Home className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900 backdrop-blur-sm">
                        {property.propertyType}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-1 line-clamp-1 font-semibold text-slate-900 dark:text-slate-100">
                        {property.name}
                      </h3>
                      <div className="mb-3 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {property.city}, {property.province}
                        </span>
                      </div>

                      <div className="mb-3 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>{property.bathrooms}</span>
                        </div>
                        {property.parkingSpaces && property.parkingSpaces > 0 && (
                          <div className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            <span>{property.parkingSpaces}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t pt-3 dark:border-slate-700">
                        <div>
                          {displayPrice ? (
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              {formatCurrency(Number(displayPrice))}
                              <span className="text-xs font-normal text-slate-500">
                                {priceLabel}
                              </span>
                            </p>
                          ) : (
                            <p className="text-sm text-slate-500">Price on request</p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center sm:py-20">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Building2 className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              No properties found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {search || hasActiveFilters
                ? 'Try adjusting your filters or search term'
                : 'Check back soon for new listings'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 bg-white/80 py-8 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8 dark:text-slate-400">
          <p>© 2024 Property CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
