import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';

/**
 * GET /api/reports/cash-flow
 * Get cash flow statement with inflows and outflows
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const propertyId = searchParams.get('propertyId');

    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    const propertyFilter = propertyId && propertyId !== 'all' ? { propertyId } : {};

    // Get all PAID payments (cash inflows)
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        status: 'PAID',
        paymentDate: {
          gte: yearStart,
          lte: yearEnd,
        },
        ...propertyFilter,
      },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        paymentType: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get all PAID expenses (cash outflows)
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        status: 'PAID',
        paidDate: {
          gte: yearStart,
          lte: yearEnd,
        },
        ...propertyFilter,
      },
      select: {
        id: true,
        amount: true,
        paidDate: true,
        category: true,
        maintenanceRequestId: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get completed maintenance requests with actualCost (that don't have linked expenses)
    const expenseMaintenanceIds = expenses
      .filter((e) => e.maintenanceRequestId)
      .map((e) => e.maintenanceRequestId);

    const maintenanceCosts = await prisma.maintenanceRequest.findMany({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
        actualCost: { gt: 0 },
        completedDate: {
          gte: yearStart,
          lte: yearEnd,
        },
        // Exclude maintenance that already has a linked expense
        id: { notIn: expenseMaintenanceIds.filter((id): id is string => id !== null) },
        ...propertyFilter,
      },
      select: {
        id: true,
        actualCost: true,
        completedDate: true,
        category: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Convert maintenance costs to expense-like format for unified processing
    const maintenanceAsExpenses = maintenanceCosts.map((m) => ({
      id: m.id,
      amount: m.actualCost!,
      paidDate: m.completedDate,
      category: 'MAINTENANCE' as const,
      property: m.property,
      isMaintenanceCost: true,
    }));

    // Combine all outflows
    const allOutflows = [
      ...expenses.map((e) => ({
        id: e.id,
        amount: e.amount,
        paidDate: e.paidDate,
        category: e.category,
        property: e.property,
        isMaintenanceCost: false,
      })),
      ...maintenanceAsExpenses,
    ];

    // Calculate monthly breakdown
    const monthlyData: Array<{
      month: string;
      monthIndex: number;
      inflows: number;
      outflows: number;
      netCashFlow: number;
    }> = [];

    for (let m = 0; m < 12; m++) {
      const monthStart = startOfMonth(new Date(year, m, 1));
      const monthEnd = endOfMonth(new Date(year, m, 1));

      const monthInflows = payments
        .filter((p) => {
          const pDate = new Date(p.paymentDate!);
          return pDate >= monthStart && pDate <= monthEnd;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const monthOutflows = allOutflows
        .filter((e) => {
          const eDate = new Date(e.paidDate!);
          return eDate >= monthStart && eDate <= monthEnd;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);

      monthlyData.push({
        month: new Date(year, m, 1).toLocaleString('default', { month: 'short' }),
        monthIndex: m,
        inflows: monthInflows,
        outflows: monthOutflows,
        netCashFlow: monthInflows - monthOutflows,
      });
    }

    // Group inflows by type
    const inflowsByType: Record<string, number> = {};
    payments.forEach((p) => {
      const type = p.paymentType;
      inflowsByType[type] = (inflowsByType[type] || 0) + Number(p.amount);
    });

    // Group outflows by category
    const outflowsByCategory: Record<string, number> = {};
    allOutflows.forEach((e) => {
      const category = e.category;
      outflowsByCategory[category] = (outflowsByCategory[category] || 0) + Number(e.amount);
    });

    // Group by property
    const propertyFlows: Record<
      string,
      {
        property: { id: string; name: string };
        inflows: number;
        outflows: number;
        netCashFlow: number;
      }
    > = {};

    payments.forEach((p) => {
      if (!p.property) return;
      const propId = p.property.id;
      if (!propertyFlows[propId]) {
        propertyFlows[propId] = {
          property: p.property,
          inflows: 0,
          outflows: 0,
          netCashFlow: 0,
        };
      }
      propertyFlows[propId].inflows += Number(p.amount);
    });

    allOutflows.forEach((e) => {
      if (!e.property) return;
      const propId = e.property.id;
      if (!propertyFlows[propId]) {
        propertyFlows[propId] = {
          property: e.property,
          inflows: 0,
          outflows: 0,
          netCashFlow: 0,
        };
      }
      propertyFlows[propId].outflows += Number(e.amount);
    });

    // Calculate net for each property
    Object.values(propertyFlows).forEach((pf) => {
      pf.netCashFlow = pf.inflows - pf.outflows;
    });

    // Summary totals
    const totalInflows = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOutflows = allOutflows.reduce((sum, e) => sum + Number(e.amount), 0);
    const netCashFlow = totalInflows - totalOutflows;

    // Calculate running balance
    let runningBalance = 0;
    const monthlyWithBalance = monthlyData.map((month) => {
      runningBalance += month.netCashFlow;
      return {
        ...month,
        runningBalance,
      };
    });

    const summary = {
      totalInflows,
      totalOutflows,
      netCashFlow,
      avgMonthlyInflow: Math.round(totalInflows / 12),
      avgMonthlyOutflow: Math.round(totalOutflows / 12),
      avgMonthlyNetFlow: Math.round(netCashFlow / 12),
      positiveMonths: monthlyData.filter((m) => m.netCashFlow > 0).length,
      negativeMonths: monthlyData.filter((m) => m.netCashFlow < 0).length,
    };

    return NextResponse.json({
      summary,
      monthlyData: monthlyWithBalance,
      inflowsByType: Object.entries(inflowsByType)
        .map(([type, amount]) => ({ type, amount }))
        .sort((a, b) => b.amount - a.amount),
      outflowsByCategory: Object.entries(outflowsByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      byProperty: Object.values(propertyFlows).sort((a, b) => b.netCashFlow - a.netCashFlow),
      year,
    });
  } catch (error) {
    console.error('Error fetching cash flow report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
