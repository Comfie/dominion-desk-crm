'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Building2, Globe, Save } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  accountType: z.enum(['INDIVIDUAL', 'COMPANY', 'AGENCY']),
  companyName: z.string().optional(),
  timezone: z.string(),
  currency: z.string(),
  language: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    photoUrl: string | null;
    accountType: string;
    companyName: string | null;
    timezone: string;
    currency: string;
    language: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    propertyLimit: number;
    emailVerified: boolean;
    createdAt: string;
  };
  usage: {
    properties: number;
    propertyLimit: number;
  };
}

const timezones = [
  { value: 'Africa/Johannesburg', label: 'South Africa (SAST)' },
  { value: 'Africa/Lagos', label: 'Nigeria (WAT)' },
  { value: 'Africa/Nairobi', label: 'Kenya (EAT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'America/New_York', label: 'New York (EST)' },
];

const currencies = [
  { value: 'ZAR', label: 'South African Rand (R)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'NGN', label: 'Nigerian Naira (₦)' },
  { value: 'KES', label: 'Kenyan Shilling (KSh)' },
];

export default function ProfileSettingsPage() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/settings/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: data?.user
      ? {
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          phone: data.user.phone || '',
          accountType: data.user.accountType as 'INDIVIDUAL' | 'COMPANY' | 'AGENCY',
          companyName: data.user.companyName || '',
          timezone: data.user.timezone,
          currency: data.user.currency,
          language: data.user.language,
        }
      : undefined,
  });

  const accountType = watch('accountType');

  const updateMutation = useMutation({
    mutationFn: async (formData: ProfileFormData) => {
      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const onSubmit = (formData: ProfileFormData) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Manage your account information and preferences"
      />

      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Profile updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Account Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Overview
            </CardTitle>
            <CardDescription>Your account status and usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{data?.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subscription</p>
                <div className="flex items-center gap-2">
                  <Badge>{data?.user.subscriptionTier}</Badge>
                  <Badge variant="outline">{data?.user.subscriptionStatus}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Properties Used</p>
                <p className="font-medium">
                  {data?.usage.properties} / {data?.usage.propertyLimit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...register('phone')} placeholder="+27 12 345 6789" />
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>Configure your account type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={accountType}
                onValueChange={(value) =>
                  setValue('accountType', value as 'INDIVIDUAL' | 'COMPANY' | 'AGENCY')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="COMPANY">Company</SelectItem>
                  <SelectItem value="AGENCY">Property Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(accountType === 'COMPANY' || accountType === 'AGENCY') && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" {...register('companyName')} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
            <CardDescription>Configure timezone and currency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={watch('timezone')}
                  onValueChange={(value) => setValue('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={watch('currency')}
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
