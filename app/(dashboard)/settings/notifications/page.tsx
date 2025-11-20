'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Mail, MessageSquare, Smartphone, Save } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NotificationPreferences {
  email: {
    bookingConfirmation: boolean;
    bookingReminder: boolean;
    paymentReceived: boolean;
    paymentReminder: boolean;
    inquiryReceived: boolean;
    maintenanceUpdates: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  };
  sms: {
    bookingConfirmation: boolean;
    checkInReminder: boolean;
    paymentReminder: boolean;
    urgentMaintenance: boolean;
  };
  push: {
    newBooking: boolean;
    newInquiry: boolean;
    paymentReceived: boolean;
    maintenanceRequest: boolean;
    taskReminder: boolean;
  };
}

export default function NotificationSettingsPage() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ preferences: NotificationPreferences }>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/settings/notifications');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    },
  });

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Initialize preferences from data
  if (data?.preferences && !preferences) {
    setPreferences(data.preferences);
  }

  const updateMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const response = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs }),
      });
      if (!response.ok) throw new Error('Failed to update preferences');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleToggle = (category: 'email' | 'sms' | 'push', setting: string, value: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [category]: {
        ...preferences[category],
        [setting]: value,
      },
    });
  };

  const handleSave = () => {
    if (preferences) {
      updateMutation.mutate(preferences);
    }
  };

  if (isLoading || !preferences) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Settings"
        description="Configure how you receive notifications"
      />

      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Notification preferences saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Manage email notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(preferences.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`email-${key}`} className="flex-1">
                {formatLabel(key)}
              </Label>
              <Switch
                id={`email-${key}`}
                checked={value}
                onCheckedChange={(checked) => handleToggle('email', key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Notifications
          </CardTitle>
          <CardDescription>
            SMS notifications for urgent updates (standard rates apply)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(preferences.sms).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`sms-${key}`} className="flex-1">
                {formatLabel(key)}
              </Label>
              <Switch
                id={`sms-${key}`}
                checked={value}
                onCheckedChange={(checked) => handleToggle('sms', key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>Browser and mobile push notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(preferences.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`push-${key}`} className="flex-1">
                {formatLabel(key)}
              </Label>
              <Switch
                id={`push-${key}`}
                checked={value}
                onCheckedChange={(checked) => handleToggle('push', key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
