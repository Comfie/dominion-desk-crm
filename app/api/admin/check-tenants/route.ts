import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/check-tenants
 * Checks tenant data to see why nextPaymentDue isn't being set
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tenants for this user
    const allTenants = await prisma.tenant.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        monthlyRent: true,
        nextPaymentDue: true,
      },
    });

    // Get active tenants with monthly rent
    const activeTenants = await prisma.tenant.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        monthlyRent: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        monthlyRent: true,
        nextPaymentDue: true,
      },
    });

    return NextResponse.json({
      totalTenants: allTenants.length,
      activeTenants: activeTenants.length,
      allTenants: allTenants.map((t) => ({
        name: `${t.firstName} ${t.lastName}`,
        email: t.email,
        status: t.status,
        monthlyRent: t.monthlyRent,
        nextPaymentDue: t.nextPaymentDue,
      })),
      eligibleForUpdate: activeTenants.map((t) => ({
        name: `${t.firstName} ${t.lastName}`,
        email: t.email,
        status: t.status,
        monthlyRent: t.monthlyRent,
        nextPaymentDue: t.nextPaymentDue,
      })),
    });
  } catch (error) {
    console.error('Error checking tenants:', error);
    return NextResponse.json({ error: 'Failed to check tenants' }, { status: 500 });
  }
}
