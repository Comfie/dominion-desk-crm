'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type MaintenanceRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
  triggerLabel?: string;
  triggerClassName?: string;
  showTrigger?: boolean;
};

export function MaintenanceRequestDialog({
  open,
  onOpenChange,
  onSubmitted,
  triggerLabel = 'New Request',
  triggerClassName,
  showTrigger = true,
}: MaintenanceRequestDialogProps) {
  const { toast } = useToast();
  const fieldClassName =
    'border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-sky-400/50';
  const selectClassName =
    'flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm outline-none transition focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/50';

  const maintenanceMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/portal/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          category: formData.get('category'),
          priority: formData.get('priority'),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request');
      }

      return result;
    },
    onSuccess: () => {
      onOpenChange(false);
      onSubmitted?.();
      toast({
        title: 'Request submitted',
        description: 'Your maintenance request has been sent successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    maintenanceMutation.mutate(new FormData(event.currentTarget));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <DialogTrigger asChild>
          <Button
            size="sm"
            className={triggerClassName || 'bg-sky-400 text-slate-950 hover:bg-sky-300'}
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span>{triggerLabel}</span>
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="border-white/10 bg-[#101826] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Submit Maintenance Request</DialogTitle>
          <DialogDescription className="text-white/60">
            Describe the issue and we&apos;ll send it to your landlord or property manager.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white/70">
              Issue Title *
            </Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g., Leaking faucet in bathroom"
              className={fieldClassName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-white/70">
              Category *
            </Label>
            <select
              id="category"
              name="category"
              required
              className={selectClassName}
              defaultValue="PLUMBING"
            >
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="APPLIANCE">Appliance</option>
              <option value="HVAC">HVAC</option>
              <option value="STRUCTURAL">Structural</option>
              <option value="PAINTING">Painting</option>
              <option value="CLEANING">Cleaning</option>
              <option value="PEST_CONTROL">Pest Control</option>
              <option value="SECURITY">Security</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-white/70">
              Priority *
            </Label>
            <select
              id="priority"
              name="priority"
              required
              className={selectClassName}
              defaultValue="NORMAL"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white/70">
              Description *
            </Label>
            <Textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="Please describe the issue in detail..."
              className={fieldClassName}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-sky-400 text-slate-950 hover:bg-sky-300"
              disabled={maintenanceMutation.isPending}
            >
              {maintenanceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
