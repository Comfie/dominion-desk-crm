import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { differenceInDays } from 'date-fns';

/**
 * GET /api/reports/tenant-payments
 * Get payment history report grouped by tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: {
      userId: string;
      tenantId?: string | { not: null };
      OR?: Array<{
        dueDate?: { gte?: Date; lte?: Date } | null;
        createdAt?: { gte?: Date; lte?: Date };
      }>;
    } = {
      userId: session.user.id,
    };

    if (tenantId && tenantId !== 'all') {
      where.tenantId = tenantId;
    } else {
      // Only show payments linked to tenants
      where.tenantId = { not: null };
    }

    // Date filtering - check both dueDate and createdAt for broader matching
    if (startDate || endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }

      // Match payments where dueDate falls in range OR createdAt falls in range (for payments without dueDate)
      where.OR = [{ dueDate: dateFilter }, { dueDate: null, createdAt: dateFilter }];
    }

    // Get all payments with tenant info
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
      orderBy: { createdAt: 'desc' },
    });

    // Calculate payment punctuality
    const paymentsWithPunctuality = payments.map((payment) => {
      let isOnTime = true; // Default to on-time
      let daysLate = 0;

      if (payment.status === 'PAID' && payment.paymentDate && payment.dueDate) {
        daysLate = differenceInDays(new Date(payment.paymentDate), new Date(payment.dueDate));
        isOnTime = daysLate <= 0;
      } else if (payment.status === 'OVERDUE' && payment.dueDate) {
        daysLate = differenceInDays(new Date(), new Date(payment.dueDate));
        isOnTime = false;
      } else if (payment.status === 'PENDING' && payment.dueDate) {
        daysLate = differenceInDays(new Date(), new Date(payment.dueDate));
        isOnTime = daysLate <= 0;
      }

      return {
        ...payment,
        amount: Number(payment.amount),
        isOnTime,
        daysLate: Math.max(0, daysLate),
      };
    });

    // Group by tenant for statistics
    const tenantStats: Record<
      string,
      {
        tenant: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
        };
        totalPayments: number;
        paidAmount: number;
        pendingAmount: number;
        overdueAmount: number;
        onTimeCount: number;
        lateCount: number;
        punctualityRate: number;
      }
    > = {};

    paymentsWithPunctuality.forEach((payment) => {
      if (!payment.tenant) return;

      const tenantKey = payment.tenant.id;
      if (!tenantStats[tenantKey]) {
        tenantStats[tenantKey] = {
          tenant: payment.tenant,
          totalPayments: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          onTimeCount: 0,
          lateCount: 0,
          punctualityRate: 0,
        };
      }

      tenantStats[tenantKey].totalPayments++;

      if (payment.status === 'PAID') {
        tenantStats[tenantKey].paidAmount += payment.amount;
        if (payment.isOnTime) {
          tenantStats[tenantKey].onTimeCount++;
        } else {
          tenantStats[tenantKey].lateCount++;
        }
      } else if (payment.status === 'PENDING') {
        tenantStats[tenantKey].pendingAmount += payment.amount;
      } else if (payment.status === 'OVERDUE') {
        tenantStats[tenantKey].overdueAmount += payment.amount;
        tenantStats[tenantKey].lateCount++;
      }
    });

    // Calculate punctuality rates
    Object.keys(tenantStats).forEach((key) => {
      const stat = tenantStats[key];
      const totalCompleted = stat.onTimeCount + stat.lateCount;
      stat.punctualityRate =
        totalCompleted > 0 ? Math.round((stat.onTimeCount / totalCompleted) * 100) : 100;
    });

    // Overall summary
    const summary = {
      totalPayments: payments.length,
      totalAmount: paymentsWithPunctuality.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: paymentsWithPunctuality
        .filter((p) => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: paymentsWithPunctuality
        .filter((p) => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0),
      overdueAmount: paymentsWithPunctuality
        .filter((p) => p.status === 'OVERDUE')
        .reduce((sum, p) => sum + p.amount, 0),
      onTimePayments: paymentsWithPunctuality.filter((p) => p.status === 'PAID' && p.isOnTime)
        .length,
      latePayments: paymentsWithPunctuality.filter(
        (p) => (p.status === 'PAID' && !p.isOnTime) || p.status === 'OVERDUE'
      ).length,
      overallPunctualityRate: 0,
    };

    const completedPayments =
      summary.onTimePayments +
      paymentsWithPunctuality.filter((p) => p.status === 'PAID' && !p.isOnTime).length;
    summary.overallPunctualityRate =
      completedPayments > 0 ? Math.round((summary.onTimePayments / completedPayments) * 100) : 100;

    return NextResponse.json({
      payments: paymentsWithPunctuality,
      tenantStats: Object.values(tenantStats),
      summary,
    });
  } catch (error) {
    console.error('Error fetching tenant payments report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
