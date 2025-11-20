'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const tenantSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(1, 'Phone is required'),
    alternatePhone: z.string().optional(),
    idNumber: z.string().optional(),
    dateOfBirth: z.string().optional(),
    currentAddress: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    employmentStatus: z.string().optional(),
    employer: z.string().optional(),
    employerPhone: z.string().optional(),
    monthlyIncome: z.union([z.number(), z.nan()]).optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    emergencyContactRelation: z.string().optional(),
    tenantType: z.string(),
    notes: z.string().optional(),
    createPortalAccess: z.boolean().optional(),
    password: z.string().optional(),
    // Property assignment fields
    assignProperty: z.boolean().optional(),
    propertyId: z.string().optional(),
    leaseStartDate: z.string().optional(),
    leaseEndDate: z.string().optional(),
    propertyMonthlyRent: z.union([z.number(), z.nan()]).optional(),
    propertyDepositPaid: z.union([z.number(), z.nan()]).optional(),
    propertyMoveInDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.createPortalAccess && !data.password) {
        return false;
      }
      if (data.createPortalAccess && data.password && data.password.length < 6) {
        return false;
      }
      return true;
    },
    {
      message: 'Password must be at least 6 characters when creating portal access',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      if (data.assignProperty && !data.propertyId) {
        return false;
      }
      if (data.assignProperty && !data.leaseStartDate) {
        return false;
      }
      if (data.assignProperty && !data.propertyMonthlyRent) {
        return false;
      }
      return true;
    },
    {
      message: 'Property, lease start date, and monthly rent are required when assigning property',
      path: ['propertyId'],
    }
  );

type TenantFormData = z.infer<typeof tenantSchema>;

const provinces = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

async function fetchAvailableProperties(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  params.append('purpose', 'tenant'); // Only show LONG_TERM or BOTH properties

  const response = await fetch(`/api/properties/available?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch available properties');
  return response.json();
}

export default function NewTenantPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [createPortalAccess, setCreatePortalAccess] = useState(false);
  const [assignProperty, setAssignProperty] = useState(false);
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      tenantType: 'TENANT',
      createPortalAccess: false,
      assignProperty: false,
    },
  });

  const { data: availableProperties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['available-properties', leaseStartDate, leaseEndDate],
    queryFn: () => fetchAvailableProperties(leaseStartDate, leaseEndDate),
    enabled: assignProperty,
  });

  const createMutation = useMutation({
    mutationFn: async (data: TenantFormData) => {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tenant');
      }
      return response.json();
    },
    onSuccess: () => {
      router.push('/tenants');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: TenantFormData) => {
    setError(null);
    // Filter out NaN values before sending to API
    const cleanedData = {
      ...data,
      monthlyIncome:
        data.monthlyIncome !== undefined && !isNaN(data.monthlyIncome)
          ? data.monthlyIncome
          : undefined,
      propertyMonthlyRent:
        data.propertyMonthlyRent !== undefined && !isNaN(data.propertyMonthlyRent)
          ? data.propertyMonthlyRent
          : undefined,
      propertyDepositPaid:
        data.propertyDepositPaid !== undefined && !isNaN(data.propertyDepositPaid)
          ? data.propertyDepositPaid
          : undefined,
    };
    createMutation.mutate(cleanedData);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Tenant" description="Create a new tenant or guest profile">
        <Button variant="outline" asChild>
          <Link href="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">{error}</div>
        )}

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details about the tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" placeholder="John" {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-destructive text-sm">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" placeholder="Smith" {...register('lastName')} />
                {errors.lastName && (
                  <p className="text-destructive text-sm">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" placeholder="+27 82 123 4567" {...register('phone')} />
                {errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                <Input id="alternatePhone" {...register('alternatePhone')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input id="idNumber" {...register('idNumber')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantType">Tenant Type</Label>
              <select
                id="tenantType"
                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                {...register('tenantType')}
              >
                <option value="TENANT">Tenant (Long-term)</option>
                <option value="GUEST">Guest (Short-term)</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Current Address</CardTitle>
            <CardDescription>Where the tenant currently lives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentAddress">Street Address</Label>
              <Input
                id="currentAddress"
                placeholder="123 Main Street"
                {...register('currentAddress')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Johannesburg" {...register('city')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" placeholder="2000" {...register('postalCode')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Information</CardTitle>
            <CardDescription>Work and income details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <select
                  id="employmentStatus"
                  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  {...register('employmentStatus')}
                >
                  <option value="">Select status</option>
                  <option value="EMPLOYED">Employed</option>
                  <option value="SELF_EMPLOYED">Self-Employed</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                  <option value="RETIRED">Retired</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Monthly Income (R)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('monthlyIncome', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employer">Employer</Label>
                <Input id="employer" placeholder="Company name" {...register('employer')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employerPhone">Employer Phone</Label>
                <Input id="employerPhone" {...register('employerPhone')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
            <CardDescription>Person to contact in case of emergency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Name</Label>
                <Input id="emergencyContactName" {...register('emergencyContactName')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Phone</Label>
                <Input id="emergencyContactPhone" {...register('emergencyContactPhone')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelation">Relationship</Label>
                <Input
                  id="emergencyContactRelation"
                  placeholder="e.g., Spouse, Parent"
                  {...register('emergencyContactRelation')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portal Access */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Portal Access</CardTitle>
            <CardDescription>
              Give tenant access to the online portal to view their rental information and submit
              maintenance requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createPortalAccess"
                checked={createPortalAccess}
                {...register('createPortalAccess')}
                onChange={(e) => setCreatePortalAccess(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="createPortalAccess" className="cursor-pointer font-normal">
                Create portal account for this tenant
              </Label>
            </div>

            {createPortalAccess && (
              <div className="space-y-2">
                <Label htmlFor="password">Portal Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-destructive text-sm">{errors.password.message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  This password will allow the tenant to log in to the portal at /portal/login
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Property Assignment</CardTitle>
            <CardDescription>
              Assign this tenant to a property and set up lease details (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="assignProperty"
                checked={assignProperty}
                {...register('assignProperty')}
                onChange={(e) => setAssignProperty(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="assignProperty" className="cursor-pointer font-normal">
                Assign tenant to a property
              </Label>
            </div>

            {assignProperty && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyId">Property *</Label>
                  <Select onValueChange={(value) => setValue('propertyId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingProperties ? (
                        <SelectItem value="loading" disabled>
                          Loading properties...
                        </SelectItem>
                      ) : availableProperties && availableProperties.length > 0 ? (
                        availableProperties.map((property: any) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name} - {property.address}, {property.city}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No available properties
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.propertyId && (
                    <p className="text-destructive text-sm">{errors.propertyId.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="leaseStartDate">Lease Start Date *</Label>
                    <Input
                      id="leaseStartDate"
                      type="date"
                      {...register('leaseStartDate')}
                      onChange={(e) => setLeaseStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaseEndDate">Lease End Date</Label>
                    <Input
                      id="leaseEndDate"
                      type="date"
                      {...register('leaseEndDate')}
                      onChange={(e) => setLeaseEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="propertyMonthlyRent">Monthly Rent (R) *</Label>
                    <Input
                      id="propertyMonthlyRent"
                      type="number"
                      placeholder="0.00"
                      {...register('propertyMonthlyRent', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyDepositPaid">Deposit Paid (R)</Label>
                    <Input
                      id="propertyDepositPaid"
                      type="number"
                      placeholder="0.00"
                      {...register('propertyDepositPaid', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyMoveInDate">Move-In Date</Label>
                  <Input id="propertyMoveInDate" type="date" {...register('propertyMoveInDate')} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional information about the tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              id="notes"
              rows={4}
              placeholder="Any additional notes..."
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              {...register('notes')}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/tenants">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Tenant'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
