'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Zap, Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { AutomationForm } from '@/components/messaging/automation-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  name: string;
}

interface Automation {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerOffset: number | null;
  triggerTimeOfDay: string | null;
  messageType: string;
  subject: string | null;
  bodyTemplate: string;
  useAiEnhancement: boolean;
  aiTone: string | null;
  applyToRentalType: string | null;
  propertyIds: string | null;
  isActive: boolean;
}

export default function EditAutomationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const automationId = params.id as string;

  // Fetch automation
  const {
    data: automation,
    isLoading,
    error,
  } = useQuery<Automation>({
    queryKey: ['automation', automationId],
    queryFn: async () => {
      const res = await fetch(`/api/messaging/automations/${automationId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch automation');
      }
      return res.json();
    },
  });

  // Fetch properties
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties-list'],
    queryFn: async () => {
      const res = await fetch('/api/properties');
      if (!res.ok) throw new Error('Failed to fetch properties');
      const result = await res.json();
      return result.data || [];
    },
  });

  // Update automation mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/messaging/automations/${automationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update automation');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', automationId] });
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast({
        title: 'Automation updated',
        description: 'Your automation has been updated successfully.',
      });
      router.push('/messages/automations');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Automation" description="Update your automated message">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </PageHeader>
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Parse propertyIds from JSON string to array
  const parsedPropertyIds = (() => {
    if (!automation?.propertyIds) return undefined;
    try {
      const value = JSON.parse(automation.propertyIds);
      return Array.isArray(value) ? value : undefined;
    } catch {
      return undefined;
    }
  })();

  const formattedAutomation = automation
    ? {
        ...automation,
        description: automation.description ?? undefined,
        propertyIds: parsedPropertyIds,
        triggerOffset: automation.triggerOffset ?? undefined,
        triggerTimeOfDay: automation.triggerTimeOfDay ?? undefined,
        subject: automation.subject ?? undefined,
        aiTone: automation.aiTone ?? undefined,
        applyToRentalType: automation.applyToRentalType ?? undefined,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Automation" description="Update your automated message">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </PageHeader>

      {automation && (
        <AutomationForm
          initialData={formattedAutomation}
          properties={properties}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync(data);
          }}
          onCancel={() => router.back()}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
