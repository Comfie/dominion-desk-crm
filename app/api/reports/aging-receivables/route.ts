import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { differenceInDays } from 'date-fns';
import { PaymentStatus, Prisma } from '@prisma/client';

/**
 * GET /api/reports/aging-receivables
 * Get aging receivables report with bucket grouping
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build where clause for outstanding payments
    const where: Prisma.PaymentWhereInput = {
      userId: session.user.id,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
    };

    if (propertyId && propertyId !== 'all') {
      where.propertyId = propertyId;
    }

    // Get all outstanding payments
    const payments = await prisma.payment.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Calculate aging bucket for each payment
    const paymentsWithAging = payments.map((payment) => {
      const dueDate = payment.dueDate ? new Date(payment.dueDate) : today;
      const daysOverdue = differenceInDays(today, dueDate);

      let agingBucket: string;
      if (daysOverdue <= 0) {
        agingBucket = 'current';
      } else if (daysOverdue <= 30) {
        agingBucket = '1-30';
      } else if (daysOverdue <= 60) {
        agingBucket = '31-60';
      } else if (daysOverdue <= 90) {
        agingBucket = '61-90';
      } else {
        agingBucket = '90+';
      }

      return {
        ...payment,
        amount: Number(payment.amount),
        daysOverdue: Math.max(0, daysOverdue),
        agingBucket,
      };
    });

    // Group by aging bucket
    const buckets = {
      current: paymentsWithAging.filter((p) => p.agingBucket === 'current'),
      '1-30': paymentsWithAging.filter((p) => p.agingBucket === '1-30'),
      '31-60': paymentsWithAging.filter((p) => p.agingBucket === '31-60'),
      '61-90': paymentsWithAging.filter((p) => p.agingBucket === '61-90'),
      '90+': paymentsWithAging.filter((p) => p.agingBucket === '90+'),
    };

    // Group by tenant for detailed breakdown
    type TenantBreakdown = {
      tenant: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
      };
      property: { id: string; name: string } | null;
      total: number;
      current: number;
      '1-30': number;
      '31-60': number;
      '61-90': number;
      '90+': number;
    };

    const tenantBreakdown: Record<string, TenantBreakdown> = {};

    paymentsWithAging.forEach((payment) => {
      if (!payment.tenant) return;

      const tenantKey = payment.tenant.id;
      if (!tenantBreakdown[tenantKey]) {
        tenantBreakdown[tenantKey] = {
          tenant: payment.tenant,
          property: payment.property,
          total: 0,
          current: 0,
          '1-30': 0,
          '31-60': 0,
          '61-90': 0,
          '90+': 0,
        };
      }

      tenantBreakdown[tenantKey].total += payment.amount;
      if (payment.agingBucket === 'current') tenantBreakdown[tenantKey].current += payment.amount;
      else if (payment.agingBucket === '1-30') tenantBreakdown[tenantKey]['1-30'] += payment.amount;
      else if (payment.agingBucket === '31-60')
        tenantBreakdown[tenantKey]['31-60'] += payment.amount;
      else if (payment.agingBucket === '61-90')
        tenantBreakdown[tenantKey]['61-90'] += payment.amount;
      else if (payment.agingBucket === '90+') tenantBreakdown[tenantKey]['90+'] += payment.amount;
    });

    // Group by property
    type PropertyBreakdown = {
      property: { id: string; name: string };
      total: number;
      current: number;
      '1-30': number;
      '31-60': number;
      '61-90': number;
      '90+': number;
    };

    const propertyBreakdown: Record<string, PropertyBreakdown> = {};

    paymentsWithAging.forEach((payment) => {
      if (!payment.property) return;

      const propertyKey = payment.property.id;
      if (!propertyBreakdown[propertyKey]) {
        propertyBreakdown[propertyKey] = {
          property: payment.property,
          total: 0,
          current: 0,
          '1-30': 0,
          '31-60': 0,
          '61-90': 0,
          '90+': 0,
        };
      }

      propertyBreakdown[propertyKey].total += payment.amount;
      if (payment.agingBucket === 'current')
        propertyBreakdown[propertyKey].current += payment.amount;
      else if (payment.agingBucket === '1-30')
        propertyBreakdown[propertyKey]['1-30'] += payment.amount;
      else if (payment.agingBucket === '31-60')
        propertyBreakdown[propertyKey]['31-60'] += payment.amount;
      else if (payment.agingBucket === '61-90')
        propertyBreakdown[propertyKey]['61-90'] += payment.amount;
      else if (payment.agingBucket === '90+')
        propertyBreakdown[propertyKey]['90+'] += payment.amount;
    });

    // Calculate summary totals
    const summary = {
      totalOutstanding: paymentsWithAging.reduce((sum, p) => sum + p.amount, 0),
      paymentCount: paymentsWithAging.length,
      current: buckets.current.reduce((sum, p) => sum + p.amount, 0),
      '1-30': buckets['1-30'].reduce((sum, p) => sum + p.amount, 0),
      '31-60': buckets['31-60'].reduce((sum, p) => sum + p.amount, 0),
      '61-90': buckets['61-90'].reduce((sum, p) => sum + p.amount, 0),
      '90+': buckets['90+'].reduce((sum, p) => sum + p.amount, 0),
      currentCount: buckets.current.length,
      '1-30Count': buckets['1-30'].length,
      '31-60Count': buckets['31-60'].length,
      '61-90Count': buckets['61-90'].length,
      '90+Count': buckets['90+'].length,
    };

    return NextResponse.json({
      payments: paymentsWithAging,
      tenantBreakdown: Object.values(tenantBreakdown).sort((a, b) => b.total - a.total),
      propertyBreakdown: Object.values(propertyBreakdown).sort((a, b) => b.total - a.total),
      summary,
    });
  } catch (error) {
    console.error('Error fetching aging receivables report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
