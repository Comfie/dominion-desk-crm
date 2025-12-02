import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/financials/reports - Get financial reports
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    // Get all payments (income) for the period
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        status: 'PAID',
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(propertyId && {
          OR: [
            {
              booking: {
                propertyId,
              },
            },
            { propertyId },
          ],
        }),
      },
      include: {
        booking: {
          select: {
            propertyId: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            properties: {
              where: { isActive: true },
              select: {
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    // Get all expenses for the period
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(propertyId && { propertyId }),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get completed maintenance requests with costs for the period
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
        completedDate: {
          gte: startDate,
          lte: endDate,
        },
        OR: [{ actualCost: { not: null } }, { estimatedCost: { not: null } }],
        ...(propertyId && { propertyId }),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(2000, i, 1).toLocaleString('default', { month: 'short' }),
      income: 0,
      expenses: 0,
      profit: 0,
    }));

    // Aggregate income by month
    payments.forEach((payment: (typeof payments)[number]) => {
      const month = new Date(payment.paymentDate).getMonth();
      monthlyData[month]!.income += Number(payment.amount);
    });

    // Aggregate expenses by month
    expenses.forEach((expense: (typeof expenses)[number]) => {
      const month = new Date(expense.expenseDate).getMonth();
      monthlyData[month]!.expenses += Number(expense.amount);
    });

    // Add maintenance costs to monthly expenses
    maintenanceRequests.forEach((maintenance: (typeof maintenanceRequests)[number]) => {
      if (maintenance.completedDate) {
        const month = new Date(maintenance.completedDate).getMonth();
        const cost = maintenance.actualCost || maintenance.estimatedCost;
        if (cost) {
          monthlyData[month]!.expenses += Number(cost);
        }
      }
    });

    // Calculate profit for each month
    monthlyData.forEach((data: (typeof monthlyData)[number]) => {
      data.profit = data.income - data.expenses;
    });

    // Calculate totals
    const totalIncome = monthlyData.reduce(
      (sum: number, m: (typeof monthlyData)[number]) => sum + m.income,
      0
    );
    const totalExpenses = monthlyData.reduce(
      (sum: number, m: (typeof monthlyData)[number]) => sum + m.expenses,
      0
    );
    const totalProfit = totalIncome - totalExpenses;

    // Income breakdown by type
    const incomeByType = payments.reduce(
      (acc: Record<string, number>, p: (typeof payments)[number]) => {
        acc[p.paymentType] = (acc[p.paymentType] || 0) + Number(p.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    // Expenses breakdown by category
    const expensesByCategory = expenses.reduce(
      (acc: Record<string, number>, e: (typeof expenses)[number]) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    // Add maintenance costs to MAINTENANCE category
    maintenanceRequests.forEach((maintenance: (typeof maintenanceRequests)[number]) => {
      const cost = maintenance.actualCost || maintenance.estimatedCost;
      if (cost) {
        expensesByCategory['MAINTENANCE'] = (expensesByCategory['MAINTENANCE'] || 0) + Number(cost);
      }
    });

    // Property performance
    const propertyPerformance: Record<
      string,
      { propertyId: string; propertyName: string; income: number; expenses: number; profit: number }
    > = {};

    payments.forEach((payment: (typeof payments)[number]) => {
      // Check multiple sources for property information
      let propId: string | null = null;
      let propName: string | null = null;

      // 1. Direct property link (preferred for rent payments)
      if (payment.property) {
        propId = payment.property.id;
        propName = payment.property.name;
      }
      // 2. Booking property
      else if (payment.booking?.property) {
        propId = payment.booking.property.id;
        propName = payment.booking.property.name;
      }
      // 3. Tenant's property
      else if (payment.tenant?.properties?.[0]?.property) {
        propId = payment.tenant.properties[0].property.id;
        propName = payment.tenant.properties[0].property.name;
      }

      if (propId && propName) {
        if (!propertyPerformance[propId]) {
          propertyPerformance[propId] = {
            propertyId: propId,
            propertyName: propName,
            income: 0,
            expenses: 0,
            profit: 0,
          };
        }
        propertyPerformance[propId].income += Number(payment.amount);
      }
    });

    expenses.forEach((expense: (typeof expenses)[number]) => {
      if (expense.property) {
        const propId = expense.property.id;
        if (!propertyPerformance[propId]) {
          propertyPerformance[propId] = {
            propertyId: propId,
            propertyName: expense.property.name,
            income: 0,
            expenses: 0,
            profit: 0,
          };
        }
        propertyPerformance[propId].expenses += Number(expense.amount);
      }
    });

    // Add maintenance costs to property performance
    maintenanceRequests.forEach((maintenance: (typeof maintenanceRequests)[number]) => {
      if (maintenance.property) {
        const propId = maintenance.property.id;
        if (!propertyPerformance[propId]) {
          propertyPerformance[propId] = {
            propertyId: propId,
            propertyName: maintenance.property.name,
            income: 0,
            expenses: 0,
            profit: 0,
          };
        }
        const cost = maintenance.actualCost || maintenance.estimatedCost;
        if (cost) {
          propertyPerformance[propId].expenses += Number(cost);
        }
      }
    });

    // Calculate profit for each property
    Object.values(propertyPerformance).forEach(
      (prop: { profit: number; income: number; expenses: number }) => {
        prop.profit = prop.income - prop.expenses;
      }
    );

    // Tax deductible expenses
    const taxDeductible = expenses
      .filter((e: (typeof expenses)[number]) => e.isDeductible)
      .reduce((sum: number, e: (typeof expenses)[number]) => sum + Number(e.amount), 0);

    return NextResponse.json({
      year: parseInt(year),
      summary: {
        totalIncome,
        totalExpenses,
        totalProfit,
        taxDeductible,
        profitMargin: totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : 0,
      },
      monthlyData,
      incomeByType,
      expensesByCategory,
      propertyPerformance: Object.values(propertyPerformance).sort(
        (a: { profit: number }, b: { profit: number }) => b.profit - a.profit
      ),
    });
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    return NextResponse.json({ error: 'Failed to fetch financial reports' }, { status: 500 });
  }
}
