import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { differenceInDays, addDays } from 'date-fns';

/**
 * GET /api/reports/lease-expiration
 * Get lease expiration report with grouping by expiration window
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const window = searchParams.get('window') || 'all'; // 30, 60, 90, all

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build where clause
    const where: {
      userId: string;
      isActive: boolean;
      leaseEndDate?: { gte?: Date; lte?: Date; not?: null };
      propertyId?: string;
    } = {
      userId: session.user.id,
      isActive: true,
      leaseEndDate: { not: null },
    };

    if (propertyId && propertyId !== 'all') {
      where.propertyId = propertyId;
    }

    // Apply window filter
    if (window !== 'all') {
      const windowDays = parseInt(window);
      where.leaseEndDate = {
        ...where.leaseEndDate,
        gte: today,
        lte: addDays(today, windowDays),
      };
    } else {
      // For 'all', only show future leases (not already expired)
      where.leaseEndDate = {
        ...where.leaseEndDate,
        gte: today,
      };
    }

    // Get all active leases with tenant and property info
    const leases = await prisma.propertyTenant.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: { leaseEndDate: 'asc' },
    });

    // Calculate days until expiry and group by window
    const leasesWithExpiry = leases.map((lease) => {
      const daysUntilExpiry = lease.leaseEndDate
        ? differenceInDays(new Date(lease.leaseEndDate), today)
        : null;

      let expiryWindow: string;
      if (daysUntilExpiry === null) {
        expiryWindow = 'no-end-date';
      } else if (daysUntilExpiry <= 30) {
        expiryWindow = '0-30';
      } else if (daysUntilExpiry <= 60) {
        expiryWindow = '31-60';
      } else if (daysUntilExpiry <= 90) {
        expiryWindow = '61-90';
      } else {
        expiryWindow = '90+';
      }

      return {
        ...lease,
        monthlyRent: Number(lease.monthlyRent),
        depositPaid: Number(lease.depositPaid),
        daysUntilExpiry,
        expiryWindow,
      };
    });

    // Group by window for summary
    const byWindow = {
      '0-30': leasesWithExpiry.filter((l) => l.expiryWindow === '0-30'),
      '31-60': leasesWithExpiry.filter((l) => l.expiryWindow === '31-60'),
      '61-90': leasesWithExpiry.filter((l) => l.expiryWindow === '61-90'),
      '90+': leasesWithExpiry.filter((l) => l.expiryWindow === '90+'),
    };

    // Also get expired leases (for reference)
    const expiredLeases = await prisma.propertyTenant.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        leaseEndDate: {
          lt: today,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Summary statistics
    const summary = {
      totalActiveLeases: leasesWithExpiry.length,
      expiringIn30Days: byWindow['0-30'].length,
      expiringIn60Days: byWindow['0-30'].length + byWindow['31-60'].length,
      expiringIn90Days:
        byWindow['0-30'].length + byWindow['31-60'].length + byWindow['61-90'].length,
      expiredLeases: expiredLeases.length,
      totalMonthlyRent: leasesWithExpiry.reduce((sum, l) => sum + l.monthlyRent, 0),
      atRiskRent: byWindow['0-30'].reduce((sum, l) => sum + l.monthlyRent, 0),
    };

    return NextResponse.json({
      leases: leasesWithExpiry,
      byWindow: {
        '0-30': {
          count: byWindow['0-30'].length,
          rentAtRisk: byWindow['0-30'].reduce((sum, l) => sum + l.monthlyRent, 0),
        },
        '31-60': {
          count: byWindow['31-60'].length,
          rentAtRisk: byWindow['31-60'].reduce((sum, l) => sum + l.monthlyRent, 0),
        },
        '61-90': {
          count: byWindow['61-90'].length,
          rentAtRisk: byWindow['61-90'].reduce((sum, l) => sum + l.monthlyRent, 0),
        },
        '90+': {
          count: byWindow['90+'].length,
          rentAtRisk: byWindow['90+'].reduce((sum, l) => sum + l.monthlyRent, 0),
        },
      },
      expiredLeases: expiredLeases.map((l) => ({
        ...l,
        monthlyRent: Number(l.monthlyRent),
        depositPaid: Number(l.depositPaid),
      })),
      summary,
    });
  } catch (error) {
    console.error('Error fetching lease expiration report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
