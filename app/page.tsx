'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Building2, Bed, Bath, MapPin, Search, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  monthlyRent: number | null;
  dailyRate: number | null;
  primaryImageUrl: string | null;
  rentalType: string;
}

export default function HomePage() {
  const [search, setSearch] = useState('');

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['public-properties', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('city', search);
      const response = await fetch(`/api/public/properties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">Property CRM</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/login">Tenant Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Manager Login</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Find Your Perfect Rental</h1>
          <p className="mb-8 text-lg text-blue-100">Browse available properties in South Africa</p>

          {/* Search */}
          <div className="mx-auto flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white pl-10 text-gray-900"
              />
            </div>
            <Button variant="secondary">Search</Button>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Available Properties</h2>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Link key={property.id} href={`/p/${property.id}`}>
                <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-700">
                    {property.primaryImageUrl ? (
                      <Image
                        src={property.primaryImageUrl}
                        alt={property.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2 className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3">{property.propertyType}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-1 line-clamp-1 font-semibold">{property.name}</h3>
                    <div className="mb-3 flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {property.city}, {property.province}
                      </span>
                    </div>

                    <div className="mb-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span>{property.bathrooms}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        {property.monthlyRent && (
                          <p className="font-bold text-blue-600">
                            {formatCurrency(Number(property.monthlyRent))}
                            <span className="text-xs font-normal text-gray-500">/month</span>
                          </p>
                        )}
                        {property.dailyRate && !property.monthlyRent && (
                          <p className="font-bold text-blue-600">
                            {formatCurrency(Number(property.dailyRate))}
                            <span className="text-xs font-normal text-gray-500">/night</span>
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold">No properties found</h3>
            <p className="text-gray-500">
              {search ? 'Try a different search term' : 'Check back soon for new listings'}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          <p>© 2024 Property CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
