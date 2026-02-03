'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Save,
  RefreshCw,
  Calendar,
  Percent,
  Building2,
  Clock,
  DollarSign,
} from 'lucide-react';

interface SettingItem {
  key: string;
  value: string;
  description: string;
  isDefault: boolean;
  updatedAt: string | null;
}

interface SubscriptionValues {
  trialDays: number;
  trialPropertyLimit: number;
  baseFee: number;
  percentageFee: number;
  minPropertyFee: number;
  maxPropertyFee: number;
  freePropertyCount: number;
  gracePeriodWarningDays: number;
  gracePeriodLimitedDays: number;
  gracePeriodReadonlyDays: number;
}

export default function AdminSubscriptionSettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [currentValues, setCurrentValues] = useState<SubscriptionValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings/subscription');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings);
      setCurrentValues(data.currentValues);

      // Initialize edit values
      const values: Record<string, string> = {};
      data.settings.forEach((s: SettingItem) => {
        values[s.key] = s.value;
      });
      setEditValues(values);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const changedSettings = settings
        .filter((s) => editValues[s.key] !== s.value)
        .map((s) => ({
          key: s.key,
          value: editValues[s.key],
        }));

      if (changedSettings.length === 0) {
        toast({
          title: 'No changes',
          description: 'No settings have been modified',
        });
        return;
      }

      const response = await fetch('/api/admin/settings/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changedSettings }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      const data = await response.json();
      setSettings(data.settings);
      setCurrentValues(data.currentValues);

      toast({
        title: 'Settings saved',
        description: `Updated ${changedSettings.length} setting(s)`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      'subscription.trial_days': 'Trial Period (Days)',
      'subscription.trial_property_limit': 'Trial Property Limit',
      'subscription.base_fee': 'Base Subscription Fee (R)',
      'subscription.percentage_fee': 'Percentage Fee (%)',
      'subscription.min_property_fee': 'Minimum Property Fee (R)',
      'subscription.max_property_fee': 'Maximum Property Fee (R)',
      'subscription.free_property_count': 'Free Properties Included',
      'subscription.grace_period_warning_days': 'Warning Period (Days)',
      'subscription.grace_period_limited_days': 'Limited Access Period (Days)',
      'subscription.grace_period_readonly_days': 'Read-Only Period (Days)',
      'payment.online_transaction_fee_percentage': 'Online Payment Transaction Fee (%)',
    };
    return labels[key] || key;
  };

  const getSettingIcon = (key: string) => {
    if (key.includes('trial_days') || key.includes('grace_period')) return Calendar;
    if (key.includes('percentage')) return Percent;
    if (key.includes('property')) return Building2;
    if (key.includes('fee')) return DollarSign;
    return Settings;
  };

  const getSettingCategory = (key: string): string => {
    if (key.includes('trial')) return 'trial';
    if (key.startsWith('payment.')) return 'payment';
    if (key.includes('fee') || key.includes('percentage') || key.includes('free_property'))
      return 'pricing';
    if (key.includes('grace')) return 'access';
    return 'other';
  };

  const hasChanges = settings.some((s) => editValues[s.key] !== s.value);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const trialSettings = settings.filter((s) => getSettingCategory(s.key) === 'trial');
  const pricingSettings = settings.filter((s) => getSettingCategory(s.key) === 'pricing');
  const accessSettings = settings.filter((s) => getSettingCategory(s.key) === 'access');
  const paymentSettings = settings.filter((s) => getSettingCategory(s.key) === 'payment');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Settings</h1>
          <p className="text-muted-foreground">
            Configure global subscription pricing and trial settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Current Summary */}
      {currentValues && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Current Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-primary h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Trial Period</p>
                  <p className="font-semibold">{currentValues.trialDays} days</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="text-primary h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Free Properties</p>
                  <p className="font-semibold">{currentValues.freePropertyCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="text-primary h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Base Fee</p>
                  <p className="font-semibold">R{currentValues.baseFee}/month</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Percent className="text-primary h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Additional Properties</p>
                  <p className="font-semibold">{currentValues.percentageFee}% of rent</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trial Settings
          </CardTitle>
          <CardDescription>Configure free trial period and limits for new users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trialSettings.map((setting) => {
            const Icon = getSettingIcon(setting.key);
            return (
              <div key={setting.key} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={setting.key} className="flex items-center gap-2">
                    <Icon className="text-muted-foreground h-4 w-4" />
                    {getSettingLabel(setting.key)}
                  </Label>
                  {setting.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <Input
                  id={setting.key}
                  type="number"
                  value={editValues[setting.key] || ''}
                  onChange={(e) => setEditValues({ ...editValues, [setting.key]: e.target.value })}
                  className="max-w-[200px]"
                />
                <p className="text-muted-foreground text-xs">{setting.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Settings
          </CardTitle>
          <CardDescription>Configure subscription pricing and fee structure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pricingSettings.map((setting) => {
            const Icon = getSettingIcon(setting.key);
            return (
              <div key={setting.key} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={setting.key} className="flex items-center gap-2">
                    <Icon className="text-muted-foreground h-4 w-4" />
                    {getSettingLabel(setting.key)}
                  </Label>
                  {setting.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <Input
                  id={setting.key}
                  type="number"
                  step={setting.key.includes('percentage') ? '0.1' : '1'}
                  value={editValues[setting.key] || ''}
                  onChange={(e) => setEditValues({ ...editValues, [setting.key]: e.target.value })}
                  className="max-w-[200px]"
                />
                <p className="text-muted-foreground text-xs">{setting.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Access Restriction Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Access Restriction Settings
          </CardTitle>
          <CardDescription>
            Configure grace periods after trial expiry (graduated restrictions)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 mb-4 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">
              <strong>How it works:</strong> After trial expires, users get a warning for X days,
              then limited access for X days, then read-only for X days, then suspended.
            </p>
          </div>
          {accessSettings.map((setting) => {
            const Icon = getSettingIcon(setting.key);
            return (
              <div key={setting.key} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={setting.key} className="flex items-center gap-2">
                    <Icon className="text-muted-foreground h-4 w-4" />
                    {getSettingLabel(setting.key)}
                  </Label>
                  {setting.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <Input
                  id={setting.key}
                  type="number"
                  value={editValues[setting.key] || ''}
                  onChange={(e) => setEditValues({ ...editValues, [setting.key]: e.target.value })}
                  className="max-w-[200px]"
                />
                <p className="text-muted-foreground text-xs">{setting.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Payment Settings */}
      {paymentSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Settings
            </CardTitle>
            <CardDescription>Configure online payment transaction fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> This fee is added to online card payments to cover payment
                processing costs. Tenants are informed of this fee before completing their payment.
                EFT/bank transfer payments do not incur this fee.
              </p>
            </div>
            {paymentSettings.map((setting) => {
              const Icon = getSettingIcon(setting.key);
              return (
                <div key={setting.key} className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={setting.key} className="flex items-center gap-2">
                      <Icon className="text-muted-foreground h-4 w-4" />
                      {getSettingLabel(setting.key)}
                    </Label>
                    {setting.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <Input
                    id={setting.key}
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editValues[setting.key] || ''}
                    onChange={(e) =>
                      setEditValues({ ...editValues, [setting.key]: e.target.value })
                    }
                    className="max-w-[200px]"
                  />
                  <p className="text-muted-foreground text-xs">{setting.description}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Save Button (sticky at bottom) */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
