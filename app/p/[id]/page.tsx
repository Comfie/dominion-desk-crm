'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Bed,
  Bath,
  Car,
  Maximize,
  MapPin,
  Check,
  X,
  Phone,
  Mail,
  Calendar,
  Send,
  Loader2,
  ArrowLeft,
  PawPrint,
  Cigarette,
  Sofa,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface PropertyData {
  property: {
    id: string;
    name: string;
    description: string | null;
    propertyType: string;
    address: string;
    city: string;
    province: string;
    bedrooms: number;
    bathrooms: number;
    size: number | null;
    furnished: boolean;
    parkingSpaces: number;
    amenities: string[];
    rentalType: string;
    monthlyRent: number | null;
    dailyRate: number | null;
    securityDeposit: number | null;
    petsAllowed: boolean;
    smokingAllowed: boolean;
    primaryImageUrl: string | null;
    images: string[];
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      companyName: string | null;
    };
  };
  bookedDates: Array<{ start: string; end: string }>;
}

export default function PublicPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  const { data, isLoading, error } = useQuery<PropertyData>({
    queryKey: ['public-property', id],
    queryFn: async () => {
      const response = await fetch(`/api/public/properties/${id}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch property');
      }
      return response.json();
    },
  });

  const handleInquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryError('');

    const formData = new FormData(e.currentTarget);
    const inquiryData = {
      propertyId: id,
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
      preferredMoveIn: formData.get('preferredMoveIn'),
    };

    try {
      const response = await fetch('/api/public/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit inquiry');
      }

      setInquirySubmitted(true);
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : 'Failed to submit inquiry');
    } finally {
      setInquiryLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="mb-6 h-8 w-48" />
          <Skeleton className="mb-6 aspect-video w-full rounded-lg" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold">Property Not Found</h2>
            <p className="mb-4 text-gray-500">
              This property is no longer available or doesn't exist.
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { property } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">Property CRM</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Property Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">{property.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            <span>
              {property.address}, {property.city}, {property.province}
            </span>
          </div>
        </div>

        {/* Property Image */}
        <div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
          {property.primaryImageUrl ? (
            <Image
              src={property.primaryImageUrl}
              alt={property.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-16 w-16 text-gray-400" />
            </div>
          )}
          <Badge className="absolute top-4 left-4">{property.propertyType}</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-500" />
                    <span>
                      {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-500" />
                    <span>
                      {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-gray-500" />
                    <span>{property.parkingSpaces} Parking</span>
                  </div>
                  {property.size && (
                    <div className="flex items-center gap-2">
                      <Maximize className="h-5 w-5 text-gray-500" />
                      <span>{property.size} m²</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.monthlyRent && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Rent</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(Number(property.monthlyRent))}
                    </span>
                  </div>
                )}
                {property.dailyRate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Daily Rate</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(Number(property.dailyRate))}
                    </span>
                  </div>
                )}
                {property.securityDeposit && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Security Deposit</span>
                    <span className="font-medium">
                      {formatCurrency(Number(property.securityDeposit))}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {property.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                    {property.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Sofa className="h-4 w-4 text-gray-500" />
                    <span>{property.furnished ? 'Furnished' : 'Unfurnished'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {property.petsAllowed ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <PawPrint className="h-4 w-4 text-gray-500" />
                    <span>{property.petsAllowed ? 'Pets Allowed' : 'No Pets'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {property.smokingAllowed ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <Cigarette className="h-4 w-4 text-gray-500" />
                    <span>{property.smokingAllowed ? 'Smoking Allowed' : 'No Smoking'}</span>
                  </div>
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Inquiry Form */}
          <div className="lg:sticky lg:top-4">
            <Card>
              <CardHeader>
                <CardTitle>Interested in this property?</CardTitle>
                <CardDescription>Send an inquiry and we'll get back to you shortly</CardDescription>
              </CardHeader>
              <CardContent>
                {inquirySubmitted ? (
                  <div className="text-center">
                    <Check className="mx-auto mb-4 h-12 w-12 text-green-500" />
                    <h3 className="mb-2 font-semibold">Inquiry Sent!</h3>
                    <p className="text-sm text-gray-500">
                      We've received your inquiry and will contact you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    {inquiryError && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
                        {inquiryError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" name="name" required placeholder="John Doe" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="john@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" name="phone" required placeholder="082 123 4567" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredMoveIn">Preferred Move-in Date</Label>
                      <Input id="preferredMoveIn" name="preferredMoveIn" type="date" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <textarea
                        id="message"
                        name="message"
                        rows={3}
                        className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                        placeholder="I'm interested in this property..."
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={inquiryLoading}>
                      {inquiryLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Inquiry
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Contact Info */}
                {property.user && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="mb-3 text-sm font-medium">Contact Directly</h4>
                    <div className="space-y-2 text-sm">
                      {property.user.companyName && (
                        <p className="font-medium">{property.user.companyName}</p>
                      )}
                      {property.user.phone && (
                        <a
                          href={`tel:${property.user.phone}`}
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {property.user.phone}
                        </a>
                      )}
                      <a
                        href={`mailto:${property.user.email}`}
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {property.user.email}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          <p>Powered by Property CRM</p>
        </div>
      </footer>
    </div>
  );
}
