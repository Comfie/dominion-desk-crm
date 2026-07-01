'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ViewingStatusActionsProps {
  viewingId: string;
  status: string;
}

const statuses = ['SCHEDULED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELLED', 'COMPLETED'];

export function ViewingStatusActions({ viewingId, status }: ViewingStatusActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);

    try {
      const response = await fetch(`/api/placement/viewings/${viewingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update viewing');
      }

      toast({
        title: 'Viewing updated',
        description: 'The viewing status has been updated.',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Could not update viewing',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value)}
        className="border-input bg-background focus-visible:ring-ring h-8 rounded-md border px-2 text-xs focus-visible:ring-1 focus-visible:outline-none"
      >
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={updating || selectedStatus === status}
        onClick={handleUpdate}
      >
        {updating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
        Update
      </Button>
    </div>
  );
}
