'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Home, Loader2, Phone, Save, ShieldCheck, User } from 'lucide-react';

import { PortalShell } from '@/components/portal/portal-shell';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

const profileSchema = z.object({
  phone: z.string().trim().min(1, 'Phone is required'),
  alternatePhone: z.string().optional(),
  currentAddress: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

type TenantProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone: string | null;
  idNumber: string | null;
  idType: string | null;
  dateOfBirth: string | null;
  currentAddress: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
};

type TenantProfileResponse = {
  tenant: TenantProfile;
};

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

function readOnlyValue(value?: string | null) {
  return value?.trim() ? value : 'Not provided';
}

const fieldClassName =
  'border-white/10 bg-white/5 text-white placeholder:text-white/35 disabled:border-white/8 disabled:bg-white/[0.03] disabled:text-white/65';

export default function TenantProfilePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<TenantProfileResponse>({
    queryKey: ['tenant-profile'],
    queryFn: async () => {
      const response = await fetch('/api/portal/profile');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }
      return response.json();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: '',
      alternatePhone: '',
      currentAddress: '',
      city: '',
      province: '',
      postalCode: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
    },
  });

  useEffect(() => {
    if (!data?.tenant) {
      return;
    }

    reset({
      phone: data.tenant.phone || '',
      alternatePhone: data.tenant.alternatePhone || '',
      currentAddress: data.tenant.currentAddress || '',
      city: data.tenant.city || '',
      province: data.tenant.province || '',
      postalCode: data.tenant.postalCode || '',
      emergencyContactName: data.tenant.emergencyContactName || '',
      emergencyContactPhone: data.tenant.emergencyContactPhone || '',
      emergencyContactRelation: data.tenant.emergencyContactRelation || '',
    });
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: async (formData: ProfileFormData) => {
      const response = await fetch('/api/portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      return response.json() as Promise<TenantProfileResponse & { message: string }>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-profile'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-portal'] });
      reset({
        phone: result.tenant.phone || '',
        alternatePhone: result.tenant.alternatePhone || '',
        currentAddress: result.tenant.currentAddress || '',
        city: result.tenant.city || '',
        province: result.tenant.province || '',
        postalCode: result.tenant.postalCode || '',
        emergencyContactName: result.tenant.emergencyContactName || '',
        emergencyContactPhone: result.tenant.emergencyContactPhone || '',
        emergencyContactRelation: result.tenant.emergencyContactRelation || '',
      });
      toast({
        title: 'Profile updated',
        description: 'Your contact information has been saved.',
      });
    },
    onError: (mutationError: Error) => {
      toast({
        title: 'Update failed',
        description: mutationError.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (formData: ProfileFormData) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <PortalShell>
        <div className="portal-page">
          <Skeleton className="h-6 w-40 rounded-full bg-white/10" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-52 rounded-full bg-white/10" />
            <Skeleton className="h-5 w-full max-w-lg rounded-full bg-white/10" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Skeleton className="h-80 rounded-[1.5rem] bg-white/10" />
            <Skeleton className="h-96 rounded-[1.5rem] bg-white/10" />
          </div>
        </div>
      </PortalShell>
    );
  }

  if (error || !data?.tenant) {
    return (
      <PortalShell>
        <Card className="portal-panel mx-auto max-w-xl">
          <CardContent className="py-10 text-center">
            <User className="mx-auto mb-4 h-10 w-10 text-white/45" />
            <h1 className="mb-2 text-xl font-semibold">Unable to load profile</h1>
            <p className="mb-6 text-sm text-white/65">
              {error instanceof Error ? error.message : 'Your profile could not be loaded.'}
            </p>
            <Link href="/portal/dashboard">
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PortalShell>
    );
  }

  const { tenant } = data;

  return (
    <PortalShell>
      <div className="portal-page">
        <div className="portal-page-header">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/portal/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>Manage Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="portal-hero">
            <div className="space-y-4">
              <span className="portal-kicker">Profile and contacts</span>
              <div className="space-y-2">
                <h1 className="portal-page-title">Manage Profile</h1>
                <p className="portal-page-description">
                  Keep your phone, address, and emergency contact details current while protected
                  identity fields stay landlord-managed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="portal-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <ShieldCheck className="h-5 w-5" />
                Verified Details
              </CardTitle>
              <CardDescription className="text-white/60">
                These details are managed by your landlord. Request changes if anything is
                incorrect.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/70">First Name</Label>
                  <Input value={tenant.firstName} disabled className={fieldClassName} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Last Name</Label>
                  <Input value={tenant.lastName} disabled className={fieldClassName} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Email Address</Label>
                <Input value={tenant.email} disabled className={fieldClassName} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/70">ID Type</Label>
                  <Input value={readOnlyValue(tenant.idType)} disabled className={fieldClassName} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">ID / Passport Number</Label>
                  <Input
                    value={readOnlyValue(tenant.idNumber)}
                    disabled
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Date of Birth</Label>
                <Input
                  value={tenant.dateOfBirth ? formatDate(tenant.dateOfBirth) : 'Not provided'}
                  disabled
                  className={fieldClassName}
                />
              </div>

              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 text-sm">
                <p className="font-medium text-white">Need to correct protected details?</p>
                <p className="mt-1 text-white/60">
                  Contact your landlord or property manager to update your name, email, ID
                  information, or date of birth.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="portal-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription className="text-white/60">
                Update the details your landlord should use to reach you quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white/70">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+27 82 123 4567"
                        className={fieldClassName}
                        {...register('phone')}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-300">{errors.phone.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alternatePhone" className="text-white/70">
                        Alternate Phone
                      </Label>
                      <Input
                        id="alternatePhone"
                        placeholder="Optional backup number"
                        className={fieldClassName}
                        {...register('alternatePhone')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentAddress" className="text-white/70">
                      Current Address
                    </Label>
                    <Textarea
                      id="currentAddress"
                      rows={4}
                      placeholder="Street address, suburb, building, unit number"
                      className={fieldClassName}
                      {...register('currentAddress')}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white/70">
                        City
                      </Label>
                      <Input id="city" className={fieldClassName} {...register('city')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province" className="text-white/70">
                        Province
                      </Label>
                      <select
                        id="province"
                        className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm transition outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/50"
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
                      <Label htmlFor="postalCode" className="text-white/70">
                        Postal Code
                      </Label>
                      <Input
                        id="postalCode"
                        className={fieldClassName}
                        {...register('postalCode')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/8 pt-6">
                  <div>
                    <h2 className="text-base font-semibold text-white">Emergency Contact</h2>
                    <p className="mt-1 text-sm text-white/60">
                      Add someone your landlord can contact if they cannot reach you.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName" className="text-white/70">
                        Full Name
                      </Label>
                      <Input
                        id="emergencyContactName"
                        className={fieldClassName}
                        {...register('emergencyContactName')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone" className="text-white/70">
                        Phone Number
                      </Label>
                      <Input
                        id="emergencyContactPhone"
                        className={fieldClassName}
                        {...register('emergencyContactPhone')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactRelation" className="text-white/70">
                      Relationship
                    </Label>
                    <Input
                      id="emergencyContactRelation"
                      placeholder="Parent, sibling, spouse, friend"
                      className={fieldClassName}
                      {...register('emergencyContactRelation')}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-white/55">Changes save to your tenant profile only.</p>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending || !isDirty}
                    className="bg-sky-400 text-slate-950 hover:bg-sky-300 disabled:bg-white/10 disabled:text-white/35"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
}
