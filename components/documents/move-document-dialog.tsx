'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, FolderInput } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Document, DocumentFolder } from '@/types/document';

interface MoveDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
  folders: DocumentFolder[];
  onSuccess?: () => void;
}

export function MoveDocumentDialog({
  open,
  onOpenChange,
  document,
  folders,
  onSuccess,
}: MoveDocumentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [targetFolderId, setTargetFolderId] = useState<string>(
    document.folderId || 'uncategorized'
  );

  const moveDocumentMutation = useMutation({
    mutationFn: async (folderId: string | null) => {
      const response = await fetch(`/api/documents/${document.id}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move document');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast({
        title: 'Document moved',
        description: 'The document has been moved successfully.',
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to move document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleMove = () => {
    const folderId = targetFolderId === 'uncategorized' ? null : targetFolderId;
    moveDocumentMutation.mutate(folderId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Move Document</DialogTitle>
          <DialogDescription>Move "{document.title}" to a different folder.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Location</Label>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-sm font-medium">{document.folder?.name || 'Uncategorized'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetFolder">Move to</Label>
            <Select value={targetFolderId} onValueChange={setTargetFolderId}>
              <SelectTrigger id="targetFolder">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {folders
                  .filter((folder) => folder.id !== document.folderId)
                  .map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: folder.color || '#6B7280' }}
                        />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={
              moveDocumentMutation.isPending ||
              (targetFolderId === 'uncategorized' && !document.folderId) ||
              targetFolderId === document.folderId
            }
          >
            {moveDocumentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moving...
              </>
            ) : (
              <>
                <FolderInput className="mr-2 h-4 w-4" />
                Move Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
