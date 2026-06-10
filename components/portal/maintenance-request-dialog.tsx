'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Image as ImageIcon, Loader2, Plus, Upload, X } from 'lucide-react';

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
import { useUploadThing } from '@/lib/uploadthing';

type MaintenanceImage = {
  url: string;
  name: string;
  size: number;
  type: string;
};

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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fieldClassName =
    'border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-sky-400/50';
  const selectClassName =
    'flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm outline-none transition focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/50';

  const { startUpload, isUploading } = useUploadThing('maintenanceImageUploader');

  const maintenanceMutation = useMutation({
    mutationFn: async (payload: {
      title: FormDataEntryValue | null;
      description: FormDataEntryValue | null;
      category: FormDataEntryValue | null;
      priority: FormDataEntryValue | null;
      images: MaintenanceImage[];
    }) => {
      const response = await fetch('/api/portal/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request');
      }

      return result;
    },
    onSuccess: () => {
      onOpenChange(false);
      setSelectedImages([]);
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

  const validateImages = (files: File[]) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 8 * 1024 * 1024;

    if (selectedImages.length + files.length > 5) {
      toast({
        title: 'Too many photos',
        description: 'You can upload up to 5 photos per maintenance request.',
        variant: 'destructive',
      });
      return [];
    }

    const validFiles: File[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid photo type',
          description: 'Please upload JPEG, PNG, or WebP images only.',
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: 'Photo too large',
          description: 'Each photo must be 8MB or smaller.',
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = validateImages(files);

    if (validFiles.length > 0) {
      setSelectedImages((current) => [...current, ...validFiles]);
    }

    event.target.value = '';
  };

  const handleSubmitWithImages = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    let images: MaintenanceImage[] = [];

    if (selectedImages.length > 0) {
      try {
        const uploadResult = await startUpload(selectedImages);

        if (!uploadResult || uploadResult.length !== selectedImages.length) {
          throw new Error('Failed to upload all selected photos');
        }

        images = uploadResult.map((file, index) => ({
          url: file.url,
          name: file.name,
          size: file.size,
          type: selectedImages[index]?.type || 'image/jpeg',
        }));
      } catch (error) {
        toast({
          title: 'Photo upload failed',
          description: error instanceof Error ? error.message : 'Failed to upload selected photos',
          variant: 'destructive',
        });
        return;
      }
    }

    await maintenanceMutation.mutateAsync({
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      priority: formData.get('priority'),
      images,
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isSubmitting = maintenanceMutation.isPending || isUploading;

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
        <form onSubmit={handleSubmitWithImages} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="maintenance-images" className="text-white/70">
              Photos
            </Label>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Add up to 5 issue photos</p>
                  <p className="text-xs text-white/50">JPEG, PNG, or WebP. Max 8MB each.</p>
                </div>
                <input
                  id="maintenance-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isSubmitting || selectedImages.length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => document.getElementById('maintenance-images')?.click()}
                  disabled={isSubmitting || selectedImages.length >= 5}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select Photos
                </Button>
              </div>

              {selectedImages.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {selectedImages.map((file, index) => (
                    <div
                      key={`${file.name}-${file.lastModified}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <ImageIcon className="h-4 w-4 shrink-0 text-sky-300" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{file.name}</p>
                          <p className="text-xs text-white/45">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-white/65 hover:bg-white/10 hover:text-white"
                        onClick={() => removeImage(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-sky-400 text-slate-950 hover:bg-sky-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? 'Uploading photos...' : 'Submitting...'}
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
