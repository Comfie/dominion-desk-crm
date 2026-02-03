'use client';

import { useState, useEffect } from 'react';
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

const editSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'VIEWER']),
  canManageProperties: z.boolean(),
  canManageBookings: z.boolean(),
  canManageTenants: z.boolean(),
  canManageFinancials: z.boolean(),
  canViewReports: z.boolean(),
});

type EditForm = z.infer<typeof editSchema>;

interface EditPermissionsModalProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    canManageProperties: boolean;
    canManageBookings: boolean;
    canManageTenants: boolean;
    canManageFinancials: boolean;
    canViewReports: boolean;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<EditForm>) => Promise<void>;
}

export function EditPermissionsModal({
  member,
  open,
  onOpenChange,
  onUpdate,
}: EditPermissionsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });

  // Reset form when member changes
  useEffect(() => {
    if (member) {
      reset({
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role as any,
        canManageProperties: member.canManageProperties,
        canManageBookings: member.canManageBookings,
        canManageTenants: member.canManageTenants,
        canManageFinancials: member.canManageFinancials,
        canViewReports: member.canViewReports,
      });
    }
  }, [member, reset]);

  const role = watch('role');

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

  const onSubmit = async (data: EditForm) => {
    if (!member) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdate(member.id, data);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Team Member Permissions</DialogTitle>
          <DialogDescription>
            Update role and permissions for {member.firstName} {member.lastName} ({member.email})
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
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Role & Permissions</h3>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
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
                  <label htmlFor="canManageProperties" className="text-sm leading-none font-medium">
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
