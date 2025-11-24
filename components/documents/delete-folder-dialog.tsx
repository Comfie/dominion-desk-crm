'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DocumentFolder } from '@/types/document';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: DocumentFolder;
  folders?: DocumentFolder[];
  onDeleted?: () => void;
  onSuccess?: () => void;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folder,
  folders = [],
  onDeleted,
  onSuccess,
}: DeleteFolderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [moveToFolderId, setMoveToFolderId] = useState<string>('uncategorized');

  const hasDocuments = (folder._count?.documents || 0) > 0;

  const deleteFolderMutation = useMutation({
    mutationFn: async () => {
      const url = new URL(`/api/folders/${folder.id}`, window.location.origin);
      if (moveToFolderId && moveToFolderId !== 'uncategorized') {
        url.searchParams.set('moveToFolderId', moveToFolderId);
      }

      const response = await fetch(url.toString(), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete folder');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Folder deleted',
        description: 'The folder has been deleted successfully.',
      });
      onDeleted?.();
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete folder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    deleteFolderMutation.mutate();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the folder "{folder.name}"?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasDocuments && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This folder contains {folder._count?.documents} document(s). What would you like to
                do with them?
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Move documents to:</Label>
              <Select value={moveToFolderId} onValueChange={setMoveToFolderId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Uncategorized (No Folder)</SelectItem>
                  {/* TODO: Add other folders here - need to fetch and filter out current folder */}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {moveToFolderId === 'uncategorized'
                  ? 'Documents will be moved to the root (uncategorized)'
                  : 'Documents will be moved to the selected folder'}
              </p>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteFolderMutation.isPending}
          >
            {deleteFolderMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Folder'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
