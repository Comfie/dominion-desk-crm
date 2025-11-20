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
          booking: {
            propertyId,
          },
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

    // Calculate monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(2000, i, 1).toLocaleString('default', { month: 'short' }),
      income: 0,
      expenses: 0,
      profit: 0,
    }));

    // Aggregate income by month
    payments.forEach((payment) => {
      const month = new Date(payment.paymentDate).getMonth();
      monthlyData[month].income += Number(payment.amount);
    });

    // Aggregate expenses by month
    expenses.forEach((expense) => {
      const month = new Date(expense.expenseDate).getMonth();
      monthlyData[month].expenses += Number(expense.amount);
    });

    // Calculate profit for each month
    monthlyData.forEach((data) => {
      data.profit = data.income - data.expenses;
    });

    // Calculate totals
    const totalIncome = monthlyData.reduce((sum: number, m) => sum + m.income, 0);
    const totalExpenses = monthlyData.reduce((sum: number, m) => sum + m.expenses, 0);
    const totalProfit = totalIncome - totalExpenses;

    // Income breakdown by type
    const incomeByType = payments.reduce(
      (acc: Record<string, number>, p) => {
        acc[p.paymentType] = (acc[p.paymentType] || 0) + Number(p.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    // Expenses breakdown by category
    const expensesByCategory = expenses.reduce(
      (acc: Record<string, number>, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    // Property performance
    const propertyPerformance: Record<
      string,
      { propertyId: string; propertyName: string; income: number; expenses: number; profit: number }
    > = {};

    payments.forEach((payment) => {
      if (payment.booking?.property) {
        const propId = payment.booking.property.id;
        if (!propertyPerformance[propId]) {
          propertyPerformance[propId] = {
            propertyId: propId,
            propertyName: payment.booking.property.name,
            income: 0,
            expenses: 0,
            profit: 0,
          };
        }
        propertyPerformance[propId].income += Number(payment.amount);
      }
    });

    expenses.forEach((expense) => {
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

    // Calculate profit for each property
    Object.values(propertyPerformance).forEach((prop) => {
      prop.profit = prop.income - prop.expenses;
    });

    // Tax deductible expenses
    const taxDeductible = expenses
      .filter((e) => e.isDeductible)
      .reduce((sum: number, e) => sum + Number(e.amount), 0);

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
      propertyPerformance: Object.values(propertyPerformance).sort((a, b) => b.profit - a.profit),
    });
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    return NextResponse.json({ error: 'Failed to fetch financial reports' }, { status: 500 });
  }
}
