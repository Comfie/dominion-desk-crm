'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link2,
  Link2Off,
  RefreshCw,
  Settings,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Calendar,
  CreditCard,
  MessageSquare,
  FileText,
  Home,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

interface IntegrationPlatform {
  platform: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  features: string[];
  integration: {
    id: string;
    isActive: boolean;
    syncEnabled: boolean;
    lastSyncAt: string | null;
    status: string;
    errorMessage: string | null;
    connectedAt: string | null;
  } | null;
  isConnected: boolean;
  isActive: boolean;
}

interface IntegrationsData {
  integrations: IntegrationPlatform[];
  byCategory: {
    booking: IntegrationPlatform[];
    calendar: IntegrationPlatform[];
    payment: IntegrationPlatform[];
    communication: IntegrationPlatform[];
    accounting: IntegrationPlatform[];
  };
  connectedCount: number;
}

const categoryIcons = {
  booking: Home,
  calendar: Calendar,
  payment: CreditCard,
  communication: MessageSquare,
  accounting: FileText,
};

const categoryLabels = {
  booking: 'Booking Platforms',
  calendar: 'Calendar',
  payment: 'Payment Gateways',
  communication: 'Communication',
  accounting: 'Accounting',
};

export default function IntegrationsPage() {
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<IntegrationPlatform | null>(null);
  const [apiKey, setApiKey] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<IntegrationsData>({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await fetch('/api/integrations');
      if (!response.ok) throw new Error('Failed to fetch integrations');
      return response.json();
    },
  });

  const connectMutation = useMutation({
    mutationFn: async ({ platform, apiKey }: { platform: string; apiKey: string }) => {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, apiKey }),
      });
      if (!response.ok) throw new Error('Failed to connect integration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setConnectDialogOpen(false);
      setApiKey('');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await fetch(`/api/integrations/${platform}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to disconnect integration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await fetch(`/api/integrations/${platform}/sync`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync integration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const toggleSyncMutation = useMutation({
    mutationFn: async ({ platform, syncEnabled }: { platform: string; syncEnabled: boolean }) => {
      const response = await fetch(`/api/integrations/${platform}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncEnabled }),
      });
      if (!response.ok) throw new Error('Failed to update integration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const handleConnect = (platform: IntegrationPlatform) => {
    setSelectedPlatform(platform);
    setConnectDialogOpen(true);
  };

  const handleSubmitConnect = () => {
    if (selectedPlatform) {
      connectMutation.mutate({ platform: selectedPlatform.platform, apiKey });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'SYNCING':
        return <Badge className="bg-blue-100 text-blue-800">Syncing</Badge>;
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect external services to automate your workflow"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline">{data?.connectedCount || 0} connected</Badge>
        </div>
      </PageHeader>

      {/* Overview Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Integration Setup</AlertTitle>
        <AlertDescription>
          Connect your accounts to automatically sync bookings, process payments, and send
          notifications. API keys are encrypted and stored securely.
        </AlertDescription>
      </Alert>

      {/* Integrations by Category */}
      {data?.byCategory &&
        Object.entries(data.byCategory).map(([category, platforms]) => {
          if (platforms.length === 0) return null;

          const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
          const label = categoryLabels[category as keyof typeof categoryLabels];

          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold">{label}</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {platforms.map((platform) => (
                  <Card key={platform.platform}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{platform.name}</CardTitle>
                          <CardDescription className="mt-1 text-sm">
                            {platform.description}
                          </CardDescription>
                        </div>
                        {platform.integration && getStatusBadge(platform.integration.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Features */}
                      <div className="flex flex-wrap gap-1">
                        {platform.features.slice(0, 3).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      {/* Connected Info */}
                      {platform.isConnected && platform.integration && (
                        <div className="space-y-2 text-sm text-gray-500">
                          {platform.integration.lastSyncAt && (
                            <p>Last synced: {formatDate(platform.integration.lastSyncAt)}</p>
                          )}
                          {platform.integration.errorMessage && (
                            <p className="text-xs text-red-600">
                              {platform.integration.errorMessage}
                            </p>
                          )}

                          {/* Auto-sync toggle */}
                          <div className="flex items-center justify-between pt-2">
                            <Label htmlFor={`sync-${platform.platform}`} className="text-sm">
                              Auto-sync
                            </Label>
                            <Switch
                              id={`sync-${platform.platform}`}
                              checked={platform.integration.syncEnabled}
                              onCheckedChange={(checked) =>
                                toggleSyncMutation.mutate({
                                  platform: platform.platform,
                                  syncEnabled: checked,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {platform.isConnected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => syncMutation.mutate(platform.platform)}
                              disabled={syncMutation.isPending}
                            >
                              <RefreshCw
                                className={`mr-1 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`}
                              />
                              Sync
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => disconnectMutation.mutate(platform.platform)}
                              disabled={disconnectMutation.isPending}
                            >
                              <Link2Off className="mr-1 h-4 w-4" />
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" onClick={() => handleConnect(platform)}>
                            <Link2 className="mr-1 h-4 w-4" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

      {/* Connect Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedPlatform?.name}</DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect this integration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedPlatform?.platform === 'PAYSTACK' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Find your API keys in your{' '}
                  <a
                    href="https://dashboard.paystack.com/#/settings/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Paystack Dashboard
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {selectedPlatform?.platform === 'STRIPE' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Find your API keys in your{' '}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Stripe Dashboard
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {selectedPlatform?.platform === 'GOOGLE_CALENDAR'
                  ? 'OAuth Token'
                  : 'API Key / Secret Key'}
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
              <p className="text-xs text-gray-500">
                Your credentials are encrypted and stored securely.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitConnect} disabled={!apiKey || connectMutation.isPending}>
              {connectMutation.isPending ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
