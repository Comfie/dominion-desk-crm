import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/auth-helpers';
import {
  getAllSubscriptionSettingsForAdmin,
  updateSetting,
  getSubscriptionSettings,
} from '@/lib/services/system-settings.service';

const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
});

/**
 * GET /api/admin/settings/subscription
 * Get all subscription settings for admin configuration
 */
export async function GET() {
  try {
    await requireSuperAdmin();

    const settings = await getAllSubscriptionSettingsForAdmin();
    const currentValues = await getSubscriptionSettings();

    return NextResponse.json({
      settings,
      currentValues,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Error fetching subscription settings:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription settings' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings/subscription
 * Update subscription settings (super admin only)
 */
export async function PUT(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = await request.json();
    const validated = updateSettingsSchema.parse(body);

    // Update each setting
    for (const setting of validated.settings) {
      await updateSetting(setting.key, setting.value, session.user.id);
    }

    // Fetch updated settings
    const settings = await getAllSubscriptionSettingsForAdmin();
    const currentValues = await getSubscriptionSettings();

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings,
      currentValues,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error updating subscription settings:', error);
    return NextResponse.json({ error: 'Failed to update subscription settings' }, { status: 500 });
  }
}
