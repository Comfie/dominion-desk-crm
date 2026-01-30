'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  taskId: string;
  item: string;
  isCompleted: boolean;
  isRequired: boolean;
  sortOrder: number;
  completedAt: string | null;
  completedBy: string | null;
}

interface ChecklistProgress {
  total: number;
  completed: number;
  percentage: number;
  requiredTotal: number;
  requiredCompleted: number;
  allRequiredComplete: boolean;
}

interface TaskChecklistProps {
  taskId: string;
  readOnly?: boolean;
}

export function TaskChecklist({ taskId, readOnly = false }: TaskChecklistProps) {
  const queryClient = useQueryClient();
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Fetch checklist items
  const { data, isLoading, error } = useQuery({
    queryKey: ['task-checklist', taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/checklist`);
      if (!response.ok) throw new Error('Failed to fetch checklist');
      return response.json() as Promise<{
        data: ChecklistItem[];
        progress: ChecklistProgress;
      }>;
    },
  });

  // Toggle item completion
  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      const response = await fetch(`/api/tasks/${taskId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      });
      if (!response.ok) throw new Error('Failed to update item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });

  // Add new item
  const addItemMutation = useMutation({
    mutationFn: async (item: string) => {
      const response = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      });
      if (!response.ok) throw new Error('Failed to add item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] });
      setNewItemText('');
      setIsAddingItem(false);
    },
  });

  // Delete item
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/tasks/${taskId}/checklist/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      addItemMutation.mutate(newItemText.trim());
    }
  };

  const handleToggleItem = (item: ChecklistItem) => {
    toggleItemMutation.mutate({
      itemId: item.id,
      isCompleted: !item.isCompleted,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Checklist...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            Error loading checklist
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const items = data?.data || [];
  const progress = data?.progress;

  // Don't show the card if there are no items and we're in read-only mode
  if (items.length === 0 && readOnly) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Checklist
            {progress && progress.total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {progress.completed}/{progress.total}
              </Badge>
            )}
          </CardTitle>
          {!readOnly && !isAddingItem && (
            <Button variant="ghost" size="sm" onClick={() => setIsAddingItem(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>

        {/* Progress bar */}
        {progress && progress.total > 0 && (
          <div className="mt-3 space-y-1">
            <Progress value={progress.percentage} className="h-2" />
            <p className="text-muted-foreground text-xs">
              {progress.percentage}% complete
              {progress.requiredTotal > 0 && !progress.allRequiredComplete && (
                <span className="text-orange-600">
                  {' '}
                  ({progress.requiredTotal - progress.requiredCompleted} required items remaining)
                </span>
              )}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Checklist items */}
        {items.length === 0 && !isAddingItem ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No checklist items yet.{' '}
            {!readOnly && (
              <button
                onClick={() => setIsAddingItem(true)}
                className="text-primary hover:underline"
              >
                Add your first item
              </button>
            )}
          </p>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'group hover:bg-muted/60 flex items-center gap-3 rounded-lg p-2 transition-colors',
                  item.isCompleted && 'bg-muted/40'
                )}
              >
                {!readOnly && (
                  <GripVertical className="text-muted-foreground h-4 w-4 cursor-grab opacity-0 transition-opacity group-hover:opacity-100" />
                )}

                <Checkbox
                  checked={item.isCompleted}
                  onCheckedChange={() => handleToggleItem(item)}
                  disabled={readOnly || toggleItemMutation.isPending}
                  className="h-5 w-5"
                />

                <div className="flex flex-1 items-center gap-2">
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      item.isCompleted && 'text-muted-foreground line-through'
                    )}
                  >
                    {item.item}
                  </span>

                  {item.isRequired && (
                    <Badge variant="outline" className="text-orange-600">
                      Required
                    </Badge>
                  )}
                </div>

                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => deleteItemMutation.mutate(item.id)}
                    disabled={deleteItemMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new item form */}
        {isAddingItem && !readOnly && (
          <form onSubmit={handleAddItem} className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Circle className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Add a checklist item..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={addItemMutation.isPending || !newItemText.trim()}
            >
              {addItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddingItem(false);
                setNewItemText('');
              }}
            >
              Cancel
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
