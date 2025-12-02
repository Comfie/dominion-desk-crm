'use client';

import { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tantml:function_calls>react-query';
// ✅ Correct Import (Assuming you have installed the package)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const bankingSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  bankAccountName: z.string().min(1, 'Account name is required'),
  bankAccountNumber: z.string().min(1, 'Account number is required'),
  bankBranchCode: z.string().optional(),
  bankSwiftCode: z.string().optional(),
  paymentInstructions: z.string().optional(),
});

type BankingFormData = z.infer<typeof bankingSchema>;

interface BankingData {
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankBranchCode: string | null;
  bankSwiftCode: string | null;
  paymentInstructions: string | null;
}

export default function BankingSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current banking details
  const { data, isLoading } = useQuery({
    queryKey: ['banking-settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings/banking');
      if (!response.ok) throw new Error('Failed to fetch banking details');
      return response.json() as Promise<BankingData>;
    },
  });

  const form = useForm<BankingFormData>({
    resolver: zodResolver(bankingSchema),
    defaultValues: {
      bankName: data?.bankName || '',
      bankAccountName: data?.bankAccountName || '',
      bankAccountNumber: data?.bankAccountNumber || '',
      bankBranchCode: data?.bankBranchCode || '',
      bankSwiftCode: data?.bankSwiftCode || '',
      paymentInstructions: data?.paymentInstructions || '',
    },
    values: data
      ? {
          bankName: data.bankName || '',
          bankAccountName: data.bankAccountName || '',
          bankAccountNumber: data.bankAccountNumber || '',
          bankBranchCode: data.bankBranchCode || '',
          bankSwiftCode: data.bankSwiftCode || '',
          paymentInstructions: data.paymentInstructions || '',
        }
      : undefined,
  });

  const updateBanking = useMutation({
    mutationFn: async (data: BankingFormData) => {
      const response = await fetch('/api/settings/banking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update banking details');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banking-settings'] });
      toast({
        title: 'Banking details updated',
        description: 'Your banking information has been saved successfully.',
      });
      setIsSaving(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update banking details',
        variant: 'destructive',
      });
      setIsSaving(false);
    },
  });

  const onSubmit = (data: BankingFormData) => {
    setIsSaving(true);
    updateBanking.mutate(data);
  };

  const hasAllRequiredDetails = data?.bankName && data?.bankAccountName && data?.bankAccountNumber;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banking Details"
        description="Configure your banking information for payment invoices"
      />

      {hasAllRequiredDetails ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Your banking details are configured. These will be included in all payment invoices sent
            to tenants.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please configure your banking details to enable payment reminders and invoices.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="text-muted-foreground h-5 w-5" />
            <div>
              <CardTitle>Bank Account Information</CardTitle>
              <CardDescription>
                This information will be displayed on payment invoices sent to your tenants
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Bank Name */}
                <div className="space-y-2">
                  <Label htmlFor="bankName">
                    Bank Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., First National Bank"
                    {...form.register('bankName')}
                  />
                  {form.formState.errors.bankName && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.bankName.message}
                    </p>
                  )}
                </div>

                {/* Account Name */}
                <div className="space-y-2">
                  <Label htmlFor="bankAccountName">
                    Account Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="bankAccountName"
                    placeholder="e.g., Your Company Name"
                    {...form.register('bankAccountName')}
                  />
                  {form.formState.errors.bankAccountName && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.bankAccountName.message}
                    </p>
                  )}
                </div>

                {/* Account Number */}
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">
                    Account Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="bankAccountNumber"
                    placeholder="e.g., 1234567890"
                    {...form.register('bankAccountNumber')}
                  />
                  {form.formState.errors.bankAccountNumber && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.bankAccountNumber.message}
                    </p>
                  )}
                </div>

                {/* Branch Code */}
                <div className="space-y-2">
                  <Label htmlFor="bankBranchCode">Branch Code</Label>
                  <Input
                    id="bankBranchCode"
                    placeholder="e.g., 250655"
                    {...form.register('bankBranchCode')}
                  />
                  <p className="text-muted-foreground text-sm">
                    Optional - Required for local transfers in some countries
                  </p>
                </div>

                {/* SWIFT Code */}
                <div className="space-y-2">
                  <Label htmlFor="bankSwiftCode">SWIFT/BIC Code</Label>
                  <Input
                    id="bankSwiftCode"
                    placeholder="e.g., FIRNZAJJ"
                    {...form.register('bankSwiftCode')}
                  />
                  <p className="text-muted-foreground text-sm">
                    Optional - Required for international transfers
                  </p>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="space-y-2">
                <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                <Textarea
                  id="paymentInstructions"
                  placeholder="Additional payment instructions for tenants (e.g., 'Please use your tenant ID as payment reference')"
                  rows={4}
                  {...form.register('paymentInstructions')}
                />
                <p className="text-muted-foreground text-sm">
                  These instructions will be included in all payment invoices
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Banking Details'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Preview Card */}
      {hasAllRequiredDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Preview</CardTitle>
            <CardDescription>
              This is how your banking details will appear on payment invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 space-y-3 rounded-lg border p-6">
              <div className="border-b pb-2 text-lg font-semibold">Banking Details for Payment</div>
              <div className="grid gap-2 text-sm">
                {data?.bankName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank Name:</span>
                    <span className="font-mono">{data.bankName}</span>
                  </div>
                )}
                {data?.bankAccountName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Name:</span>
                    <span className="font-mono">{data.bankAccountName}</span>
                  </div>
                )}
                {data?.bankAccountNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Number:</span>
                    <span className="font-mono">{data.bankAccountNumber}</span>
                  </div>
                )}
                {data?.bankBranchCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Branch Code:</span>
                    <span className="font-mono">{data.bankBranchCode}</span>
                  </div>
                )}
                {data?.bankSwiftCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SWIFT Code:</span>
                    <span className="font-mono">{data.bankSwiftCode}</span>
                  </div>
                )}
              </div>
              {data?.paymentInstructions && (
                <div className="mt-4 border-t pt-4">
                  <div className="text-muted-foreground mb-2 text-sm">Payment Instructions:</div>
                  <div className="text-sm">{data.paymentInstructions}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
