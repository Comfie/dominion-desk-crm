'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
  size: z.number().optional().nullable(),
  furnished: z.boolean(),
  parkingSpaces: z.number(),
  rentalType: z.string(),
  monthlyRent: z.number().optional().nullable(),
  dailyRate: z.number().optional().nullable(),
  securityDeposit: z.number().optional().nullable(),
  petsAllowed: z.boolean(),
  smokingAllowed: z.boolean(),
  status: z.string(),
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  houseRules: z.string().optional().nullable(),
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

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Under Maintenance' },
  { value: 'ARCHIVED', label: 'Archived' },
];

async function fetchProperty(id: string) {
  const response = await fetch(`/api/properties/${id}`);
  if (!response.ok) throw new Error('Failed to fetch property');
  return response.json();
}

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchProperty(id),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
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
      status: 'ACTIVE',
    },
  });

  // Update form when property data is loaded
  useEffect(() => {
    if (property) {
      reset({
        name: property.name,
        description: property.description || '',
        propertyType: property.propertyType,
        address: property.address,
        city: property.city,
        province: property.province,
        postalCode: property.postalCode,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        size: property.size || null,
        furnished: property.furnished,
        parkingSpaces: property.parkingSpaces,
        rentalType: property.rentalType,
        monthlyRent: property.monthlyRent || null,
        dailyRate: property.dailyRate || null,
        securityDeposit: property.securityDeposit || null,
        petsAllowed: property.petsAllowed,
        smokingAllowed: property.smokingAllowed,
        status: property.status,
        checkInTime: property.checkInTime || null,
        checkOutTime: property.checkOutTime || null,
        houseRules: property.houseRules || null,
      });
      setImageUrl(property.primaryImageUrl || null);
    }
  }, [property, reset]);

  const rentalType = watch('rentalType');

  const updateMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          primaryImageUrl: imageUrl,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update property');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      router.push(`/properties/${id}`);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: PropertyFormData) => {
    setError(null);
    updateMutation.mutate(data);
  };

  if (isLoadingProperty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg">Property not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Property" description={`Update ${property.name}`}>
        <Button variant="outline" asChild>
          <Link href={`/properties/${id}`}>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('status')}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
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
            <CardDescription>Upload or change the main image</CardDescription>
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
                <Input id="bedrooms" type="number" min="0" {...register('bedrooms')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input id="bathrooms" type="number" min="0" step="0.5" {...register('bathrooms')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parkingSpaces">Parking</Label>
                <Input id="parkingSpaces" type="number" min="0" {...register('parkingSpaces')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size (m²)</Label>
                <Input id="size" type="number" min="0" {...register('size')} />
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
                    {...register('monthlyRent')}
                  />
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
                    {...register('dailyRate')}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="securityDeposit">Security Deposit (R)</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  min="0"
                  placeholder="15000"
                  {...register('securityDeposit')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Settings</CardTitle>
            <CardDescription>Check-in/out times and house rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checkInTime">Check-in Time</Label>
                <Input id="checkInTime" type="time" {...register('checkInTime')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOutTime">Check-out Time</Label>
                <Input id="checkOutTime" type="time" {...register('checkOutTime')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="houseRules">House Rules</Label>
              <textarea
                id="houseRules"
                rows={4}
                placeholder="Enter house rules..."
                className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                {...register('houseRules')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/properties/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
