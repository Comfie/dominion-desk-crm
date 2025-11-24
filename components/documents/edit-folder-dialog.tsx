'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DocumentFolder, UpdateFolderInput } from '@/types/document';

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: DocumentFolder;
  onSuccess?: () => void;
}

const FOLDER_COLORS = [
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Green', value: '#10B981' },
  { label: 'Yellow', value: '#F59E0B' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Gray', value: '#6B7280' },
];

const FOLDER_ICONS = [
  { label: 'Folder', value: 'folder' },
  { label: 'File Text', value: 'file-text' },
  { label: 'User', value: 'user' },
  { label: 'Dollar Sign', value: 'dollar-sign' },
  { label: 'Home', value: 'home' },
  { label: 'Briefcase', value: 'briefcase' },
  { label: 'Shield', value: 'shield' },
  { label: 'Key', value: 'key' },
];

export function EditFolderDialog({ open, onOpenChange, folder, onSuccess }: EditFolderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<UpdateFolderInput>({
    name: folder.name,
    description: folder.description || '',
    color: folder.color || '#3B82F6',
    icon: folder.icon || 'folder',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: folder.name,
        description: folder.description || '',
        color: folder.color || '#3B82F6',
        icon: folder.icon || 'folder',
      });
    }
  }, [open, folder]);

  const updateFolderMutation = useMutation({
    mutationFn: async (data: UpdateFolderInput) => {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update folder');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast({
        title: 'Folder updated',
        description: 'The folder has been updated successfully.',
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update folder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast({
        title: 'Folder name required',
        description: 'Please enter a folder name.',
        variant: 'destructive',
      });
      return;
    }
    updateFolderMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>Update the folder name, color, and icon.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Folder Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Insurance Documents"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Folder Color</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className="h-10 w-10 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color.value,
                      borderColor: formData.color === color.value ? '#000' : 'transparent',
                    }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Folder Icon</Label>
              <div className="grid grid-cols-4 gap-2">
                {FOLDER_ICONS.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    className="flex items-center justify-center rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    style={{
                      borderColor: formData.icon === icon.value ? formData.color : undefined,
                      borderWidth: formData.icon === icon.value ? 2 : 1,
                    }}
                    onClick={() => setFormData({ ...formData, icon: icon.value })}
                  >
                    <span className="text-sm">{icon.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateFolderMutation.isPending}>
              {updateFolderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Folder'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
