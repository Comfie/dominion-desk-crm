'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { AutomationForm } from '@/components/messaging/automation-form';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  name: string;
}

export default function NewAutomationPage() {
  const { toast } = useToast();
  const router = useRouter();

  // Fetch properties for filtering
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties-list'],
    queryFn: async () => {
      const res = await fetch('/api/properties');
      if (!res.ok) throw new Error('Failed to fetch properties');
      const result = await res.json();
      return result.data || [];
    },
  });

  // Create automation mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/messaging/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create automation');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Automation created',
        description: 'Your automation has been created successfully.',
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

  return (
    <div className="space-y-6">
      <PageHeader title="Create Automation" description="Set up a new automated message">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </PageHeader>

      <AutomationForm
        properties={properties}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        onCancel={() => router.back()}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
