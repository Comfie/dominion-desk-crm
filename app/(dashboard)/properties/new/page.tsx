'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from '@/components/ui/image-upload';

const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  description: z.string().optional(),
  propertyType: z.string().min(1, 'Property type is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  bedrooms: z.number().min(0, 'Must be 0 or more'),
  bathrooms: z.number().min(0, 'Must be 0 or more'),
  size: z.number().optional(),
  furnished: z.boolean(),
  parkingSpaces: z.number(),
  rentalType: z.string(),
  monthlyRent: z.number().optional(),
  dailyRate: z.number().optional(),
  securityDeposit: z.number().optional(),
  petsAllowed: z.boolean(),
  smokingAllowed: z.boolean(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

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

const provinces = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
];

export default function NewPropertyPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      rentalType: 'LONG_TERM',
      bedrooms: 1,
      bathrooms: 1,
      parkingSpaces: 0,
      furnished: false,
      petsAllowed: false,
      smokingAllowed: false,
    },
  });

  const rentalType = watch('rentalType');

  const createMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          primaryImageUrl: imageUrl,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create property');
      }
      return response.json();
    },
    onSuccess: () => {
      router.push('/properties');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: PropertyFormData) => {
    setError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Property" description="Create a new property listing">
        <Button variant="outline" asChild>
          <Link href="/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">{error}</div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General details about your property</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Modern 2BR Apartment in Sandton"
                  {...register('name')}
                />
                {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type *</Label>
                <select
                  id="propertyType"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('propertyType')}
                >
                  <option value="">Select type</option>
                  {propertyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.propertyType && (
                  <p className="text-destructive text-sm">{errors.propertyType.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe your property..."
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                {...register('description')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Image */}
        <Card>
          <CardHeader>
            <CardTitle>Property Image</CardTitle>
            <CardDescription>Upload a main image for your property</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload value={imageUrl} onChange={setImageUrl} folder="properties" />
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Where is the property located?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input id="address" placeholder="e.g., 123 Main Street" {...register('address')} />
              {errors.address && (
                <p className="text-destructive text-sm">{errors.address.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" placeholder="e.g., Johannesburg" {...register('city')} />
                {errors.city && <p className="text-destructive text-sm">{errors.city.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province *</Label>
                <select
                  id="province"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('province')}
                >
                  <option value="">Select province</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <p className="text-destructive text-sm">{errors.province.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input id="postalCode" placeholder="e.g., 2196" {...register('postalCode')} />
                {errors.postalCode && (
                  <p className="text-destructive text-sm">{errors.postalCode.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>Specifications and features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  {...register('bedrooms', { valueAsNumber: true })}
                />
                {errors.bedrooms && (
                  <p className="text-destructive text-sm">{errors.bedrooms.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  {...register('bathrooms', { valueAsNumber: true })}
                />
                {errors.bathrooms && (
                  <p className="text-destructive text-sm">{errors.bathrooms.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parkingSpaces">Parking</Label>
                <Input
                  id="parkingSpaces"
                  type="number"
                  min="0"
                  {...register('parkingSpaces', { valueAsNumber: true })}
                />
                {errors.parkingSpaces && (
                  <p className="text-destructive text-sm">{errors.parkingSpaces.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size (m²)</Label>
                <Input
                  id="size"
                  type="number"
                  min="0"
                  {...register('size', { valueAsNumber: true })}
                />
                {errors.size && <p className="text-destructive text-sm">{errors.size.message}</p>}
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" {...register('furnished')} />
                <span className="text-sm">Furnished</span>
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" {...register('petsAllowed')} />
                <span className="text-sm">Pets Allowed</span>
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" {...register('smokingAllowed')} />
                <span className="text-sm">Smoking Allowed</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set your rental rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rentalType">Rental Type</Label>
              <select
                id="rentalType"
                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none sm:w-auto"
                {...register('rentalType')}
              >
                <option value="LONG_TERM">Long-term (Monthly)</option>
                <option value="SHORT_TERM">Short-term (Daily)</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {(rentalType === 'LONG_TERM' || rentalType === 'BOTH') && (
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent (R)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    min="0"
                    placeholder="15000"
                    {...register('monthlyRent', { valueAsNumber: true })}
                  />
                  {errors.monthlyRent && (
                    <p className="text-destructive text-sm">{errors.monthlyRent.message}</p>
                  )}
                </div>
              )}

              {(rentalType === 'SHORT_TERM' || rentalType === 'BOTH') && (
                <div className="space-y-2">
                  <Label htmlFor="dailyRate">Daily Rate (R)</Label>
                  <Input
                    id="dailyRate"
                    type="number"
                    min="0"
                    placeholder="800"
                    {...register('dailyRate', { valueAsNumber: true })}
                  />
                  {errors.dailyRate && (
                    <p className="text-destructive text-sm">{errors.dailyRate.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="securityDeposit">Security Deposit (R)</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  min="0"
                  placeholder="15000"
                  {...register('securityDeposit', { valueAsNumber: true })}
                />
                {errors.securityDeposit && (
                  <p className="text-destructive text-sm">{errors.securityDeposit.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/properties">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Property'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
