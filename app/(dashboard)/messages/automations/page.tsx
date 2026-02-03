'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Zap, Plus, AlertCircle } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { AutomationCard } from '@/components/messaging/automation-card';
import { TestAutomationModal } from '@/components/messaging/test-automation-modal';
import { useToast } from '@/hooks/use-toast';

interface Automation {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  messageType: string;
  isActive: boolean;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  createdAt: Date | string;
}

interface AutomationsResponse {
  automations: Automation[];
  count: number;
}

export default function AutomationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<string | null>(null);
  const [triggerFilter, setTriggerFilter] = useState<string>('all');

  // Fetch automations
  const { data, isLoading, error } = useQuery<AutomationsResponse>({
    queryKey: ['automations', triggerFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (triggerFilter !== 'all') {
        params.append('triggerType', triggerFilter);
      }

      const res = await fetch(`/api/messaging/automations?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch automations');
      }
      const result = await res.json();
      return { automations: result, count: result.length };
    },
  });

  // Toggle automation active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/messaging/automations/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to toggle automation');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast({
        title: 'Automation updated',
        description: 'Status changed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete automation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/messaging/automations/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete automation');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast({
        title: 'Automation deleted',
        description: 'Automation has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Test automation
  const testMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/messaging/automations/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send test message');
      }

      return res.json();
    },
  });

  const handleEdit = (id: string) => {
    router.push(`/messages/automations/${id}`);
  };

  const handleDelete = (id: string) => {
    setAutomationToDelete(id);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (automationToDelete) {
      deleteMutation.mutate(automationToDelete);
      setDeleteAlertOpen(false);
      setAutomationToDelete(null);
    }
  };

  const handleTest = (id: string) => {
    const automation = data?.automations.find((a) => a.id === id);
    if (automation) {
      setSelectedAutomation(automation);
      setTestModalOpen(true);
    }
  };

  const stats = data
    ? {
        total: data.count,
        active: data.automations.filter((a) => a.isActive).length,
        totalSent: data.automations.reduce((sum, a) => sum + a.totalSent, 0),
      }
    : { total: 0, active: 0, totalSent: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Message Automations"
        description="Automate your guest and tenant communications"
      >
        <Button onClick={() => router.push('/messages/automations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Automation
        </Button>
      </PageHeader>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
            <Zap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {stats.active}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automations</CardTitle>
              <CardDescription>Manage your automated messages</CardDescription>
            </div>
            <Select value={triggerFilter} onValueChange={setTriggerFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by trigger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Triggers</SelectItem>
                <SelectItem value="BOOKING_CONFIRMED">Booking Confirmed</SelectItem>
                <SelectItem value="CHECK_IN_REMINDER">Check-in Reminder</SelectItem>
                <SelectItem value="CHECK_OUT_REMINDER">Check-out Reminder</SelectItem>
                <SelectItem value="PAYMENT_REMINDER">Payment Reminder</SelectItem>
                <SelectItem value="REVIEW_REQUEST">Review Request</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          )}

          {!isLoading && data && data.automations.length === 0 && (
            <div className="py-12 text-center">
              <Zap className="text-muted-foreground mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No automations yet</h3>
              <p className="text-muted-foreground mt-2">
                Create your first automation to start sending automated messages.
              </p>
              <Button className="mt-4" onClick={() => router.push('/messages/automations/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Automation
              </Button>
            </div>
          )}

          {!isLoading && data && data.automations.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.automations.map((automation) => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTest={handleTest}
                  onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Modal */}
      <TestAutomationModal
        automation={selectedAutomation}
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        onTest={async (id, data) => {
          await testMutation.mutateAsync({ id, data });
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this automation? This action cannot be undone. Any
              scheduled messages from this automation will be cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
