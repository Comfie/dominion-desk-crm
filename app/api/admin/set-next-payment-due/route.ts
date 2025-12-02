import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/set-next-payment-due
 * Sets nextPaymentDue for all active tenants based on landlord's rentalDueDay setting
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Setting nextPaymentDue for tenants...');

    // Get all active tenants for this user
    const tenants = await prisma.tenant.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        monthlyRent: true,
        properties: {
          where: { isActive: true },
          select: {
            monthlyRent: true,
          },
          take: 1,
        },
      },
    });

    // Get user's rental due day setting
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { rentalDueDay: true },
    });

    const rentalDueDay = user?.rentalDueDay || 1;

    console.log(`Found ${tenants.length} active tenants with monthly rent`);
    console.log(`Using rental due day: ${rentalDueDay}`);

    let updated = 0;
    let skipped = 0;

    for (const tenant of tenants) {
      // Check if tenant has monthly rent configured (either on tenant or property relationship)
      const hasRent = tenant.monthlyRent || tenant.properties[0]?.monthlyRent;

      if (!hasRent) {
        console.log(
          `Skipping tenant ${tenant.firstName} ${tenant.lastName} - No monthly rent configured`
        );
        skipped++;
        continue;
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentDay = now.getDate();

      // If we're past the due day this month, set for next month
      let targetMonth = currentMonth;
      let targetYear = currentYear;

      if (currentDay >= rentalDueDay) {
        targetMonth = currentMonth + 1;
        if (targetMonth > 11) {
          targetMonth = 0;
          targetYear = currentYear + 1;
        }
      }

      // Cap at 28 to avoid month-end issues
      const dueDay = Math.min(rentalDueDay, 28);
      const nextPaymentDue = new Date(targetYear, targetMonth, dueDay, 9, 0, 0);

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { nextPaymentDue },
      });

      console.log(
        `Updated tenant ${tenant.firstName} ${tenant.lastName} - Next payment due: ${nextPaymentDue.toDateString()}`
      );
      updated++;
    }

    console.log(`\nUpdated ${updated} tenants with nextPaymentDue`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} tenants with nextPaymentDue, skipped ${skipped} tenants without rent`,
      rentalDueDay,
      tenantsUpdated: updated,
      tenantsSkipped: skipped,
    });
  } catch (error) {
    console.error('Error setting nextPaymentDue:', error);
    return NextResponse.json({ error: 'Failed to set nextPaymentDue' }, { status: 500 });
  }
}
