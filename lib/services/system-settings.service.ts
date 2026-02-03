import { prisma } from '@/lib/db';

/**
 * Default subscription settings - used when no setting is found in DB
 */
const DEFAULT_SETTINGS = {
  // Trial settings
  'subscription.trial_days': { value: '60', description: 'Number of days for free trial' },
  'subscription.trial_property_limit': { value: '2', description: 'Max properties during trial' },

  // Pricing settings
  'subscription.base_fee': { value: '299', description: 'Base monthly subscription fee (R)' },
  'subscription.percentage_fee': {
    value: '4',
    description: 'Percentage of rent for properties 3+',
  },
  'subscription.min_property_fee': { value: '99', description: 'Minimum fee per property (R)' },
  'subscription.max_property_fee': { value: '999', description: 'Maximum fee per property (R)' },
  'subscription.free_property_count': {
    value: '2',
    description: 'Number of free properties included',
  },

  // Access restrictions
  'subscription.grace_period_warning_days': {
    value: '7',
    description: 'Days after trial expiry before limiting',
  },
  'subscription.grace_period_limited_days': {
    value: '14',
    description: 'Days after trial expiry before read-only',
  },
  'subscription.grace_period_readonly_days': {
    value: '30',
    description: 'Days after trial expiry before suspension',
  },

  // Payment settings
  'payment.online_transaction_fee_percentage': {
    value: '3',
    description: 'Transaction fee percentage for online card payments (%)',
  },
};

export type SubscriptionSettingKey = keyof typeof DEFAULT_SETTINGS;

export interface SubscriptionSettings {
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

/**
 * Get a single setting value
 */
export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.systemSettings.findUnique({
    where: { key },
  });

  if (setting) {
    return setting.value;
  }

  // Return default if exists
  const defaultSetting = DEFAULT_SETTINGS[key as SubscriptionSettingKey];
  return defaultSetting?.value || null;
}

/**
 * Get a setting value as a number
 */
export async function getSettingNumber(key: string, defaultValue: number = 0): Promise<number> {
  const value = await getSetting(key);
  if (value === null) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get all subscription-related settings
 */
export async function getSubscriptionSettings(): Promise<SubscriptionSettings> {
  // Fetch all subscription settings at once
  const settings = await prisma.systemSettings.findMany({
    where: {
      key: { startsWith: 'subscription.' },
    },
  });

  // Create a map for quick lookup
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  // Helper to get value with default
  const getValue = (key: string): number => {
    const value = settingsMap.get(key);
    if (value) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) return parsed;
    }
    const defaultSetting = DEFAULT_SETTINGS[key as SubscriptionSettingKey];
    return defaultSetting ? parseFloat(defaultSetting.value) : 0;
  };

  return {
    trialDays: getValue('subscription.trial_days'),
    trialPropertyLimit: getValue('subscription.trial_property_limit'),
    baseFee: getValue('subscription.base_fee'),
    percentageFee: getValue('subscription.percentage_fee'),
    minPropertyFee: getValue('subscription.min_property_fee'),
    maxPropertyFee: getValue('subscription.max_property_fee'),
    freePropertyCount: getValue('subscription.free_property_count'),
    gracePeriodWarningDays: getValue('subscription.grace_period_warning_days'),
    gracePeriodLimitedDays: getValue('subscription.grace_period_limited_days'),
    gracePeriodReadonlyDays: getValue('subscription.grace_period_readonly_days'),
  };
}

/**
 * Update a setting value (admin only)
 */
export async function updateSetting(key: string, value: string, adminId: string): Promise<void> {
  const defaultSetting = DEFAULT_SETTINGS[key as SubscriptionSettingKey];

  await prisma.systemSettings.upsert({
    where: { key },
    create: {
      key,
      value,
      description: defaultSetting?.description || null,
      category: 'subscription',
      updatedBy: adminId,
    },
    update: {
      value,
      updatedBy: adminId,
    },
  });
}

/**
 * Get all settings with their descriptions for admin UI
 */
export async function getAllSubscriptionSettingsForAdmin() {
  const settings = await prisma.systemSettings.findMany({
    where: {
      OR: [{ key: { startsWith: 'subscription.' } }, { key: { startsWith: 'payment.' } }],
    },
  });

  const settingsMap = new Map(settings.map((s) => [s.key, s]));

  // Merge with defaults to show all available settings
  const allSettings = Object.entries(DEFAULT_SETTINGS).map(([key, defaultVal]) => {
    const dbSetting = settingsMap.get(key);
    return {
      key,
      value: dbSetting?.value || defaultVal.value,
      description: dbSetting?.description || defaultVal.description,
      isDefault: !dbSetting,
      updatedAt: dbSetting?.updatedAt || null,
      updatedBy: dbSetting?.updatedBy || null,
      category: key.startsWith('subscription.') ? 'subscription' : 'payment',
    };
  });

  return allSettings;
}

/**
 * Get payment settings
 */
export async function getPaymentSettings(): Promise<{
  onlineTransactionFeePercentage: number;
}> {
  const feePercentage = await getSettingNumber(
    'payment.online_transaction_fee_percentage',
    3 // Default 3%
  );

  return {
    onlineTransactionFeePercentage: feePercentage,
  };
}

/**
 * Calculate transaction fee for an amount
 */
export function calculateTransactionFee(
  amount: number,
  feePercentage: number
): { fee: number; totalWithFee: number } {
  const fee = Math.round((amount * feePercentage) / 100);
  const totalWithFee = amount + fee;

  return { fee, totalWithFee };
}

/**
 * Initialize default settings in database (run during setup)
 */
export async function initializeDefaultSettings(): Promise<void> {
  for (const [key, setting] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!existing) {
      await prisma.systemSettings.create({
        data: {
          key,
          value: setting.value,
          description: setting.description,
          category: key.startsWith('subscription.') ? 'subscription' : 'payment',
        },
      });
    }
  }
}
