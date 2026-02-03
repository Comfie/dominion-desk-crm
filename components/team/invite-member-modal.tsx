'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'VIEWER']),
  canManageProperties: z.boolean(),
  canManageBookings: z.boolean(),
  canManageTenants: z.boolean(),
  canManageFinancials: z.boolean(),
  canViewReports: z.boolean(),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: InviteForm) => Promise<void>;
}

export function InviteMemberModal({ open, onOpenChange, onInvite }: InviteMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'VIEWER',
      canManageProperties: false,
      canManageBookings: false,
      canManageTenants: false,
      canManageFinancials: false,
      canViewReports: true,
    },
  });

  const role = watch('role');

  // Auto-set permissions based on role
  const handleRoleChange = (newRole: string) => {
    setValue('role', newRole as any);

    switch (newRole) {
      case 'OWNER':
      case 'ADMIN':
        setValue('canManageProperties', true);
        setValue('canManageBookings', true);
        setValue('canManageTenants', true);
        setValue('canManageFinancials', true);
        setValue('canViewReports', true);
        break;
      case 'MANAGER':
        setValue('canManageProperties', true);
        setValue('canManageBookings', true);
        setValue('canManageTenants', true);
        setValue('canManageFinancials', false);
        setValue('canViewReports', true);
        break;
      case 'VIEWER':
        setValue('canManageProperties', false);
        setValue('canManageBookings', false);
        setValue('canManageTenants', false);
        setValue('canManageFinancials', false);
        setValue('canViewReports', true);
        break;
    }
  };

  const onSubmit = async (data: InviteForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onInvite(data);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to invite team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to a new team member. They'll receive an email with instructions to
            join your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" {...register('firstName')} placeholder="John" />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" {...register('lastName')} placeholder="Doe" />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Role & Permissions</h3>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner - Full access</SelectItem>
                  <SelectItem value="ADMIN">Admin - Manage everything</SelectItem>
                  <SelectItem value="MANAGER">Manager - Manage operations</SelectItem>
                  <SelectItem value="VIEWER">Viewer - View only</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
            </div>

            {/* Permissions */}
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Custom Permissions</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canManageProperties"
                    checked={watch('canManageProperties')}
                    onCheckedChange={(checked) =>
                      setValue('canManageProperties', checked as boolean)
                    }
                  />
                  <label
                    htmlFor="canManageProperties"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Manage Properties
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canManageBookings"
                    checked={watch('canManageBookings')}
                    onCheckedChange={(checked) => setValue('canManageBookings', checked as boolean)}
                  />
                  <label htmlFor="canManageBookings" className="text-sm leading-none font-medium">
                    Manage Bookings
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canManageTenants"
                    checked={watch('canManageTenants')}
                    onCheckedChange={(checked) => setValue('canManageTenants', checked as boolean)}
                  />
                  <label htmlFor="canManageTenants" className="text-sm leading-none font-medium">
                    Manage Tenants
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canManageFinancials"
                    checked={watch('canManageFinancials')}
                    onCheckedChange={(checked) =>
                      setValue('canManageFinancials', checked as boolean)
                    }
                  />
                  <label htmlFor="canManageFinancials" className="text-sm leading-none font-medium">
                    Manage Financials
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canViewReports"
                    checked={watch('canViewReports')}
                    onCheckedChange={(checked) => setValue('canViewReports', checked as boolean)}
                  />
                  <label htmlFor="canViewReports" className="text-sm leading-none font-medium">
                    View Reports
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
