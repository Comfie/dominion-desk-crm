import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const groupBy = searchParams.get('groupBy') || 'month'; // month, property, source

    const yearInt = parseInt(year);
    const startOfYear = new Date(yearInt, 0, 1);
    const endOfYear = new Date(yearInt, 11, 31, 23, 59, 59);

    // Get all payments for the year
    const paymentWhere = {
      userId: session.user.id,
      status: 'PAID' as const,
      paymentDate: {
        gte: startOfYear,
        lte: endOfYear,
      },
    };

    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      include: {
        booking: {
          select: {
            propertyId: true,
            source: true,
            property: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Get all expenses for the year
    const expenseWhere = {
      userId: session.user.id,
      expenseDate: {
        gte: startOfYear,
        lte: endOfYear,
      },
      ...(propertyId && { propertyId }),
    };

    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      include: {
        property: {
          select: { name: true },
        },
      },
    });

    // Calculate totals
    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

    const netIncome = totalRevenue - totalExpenses;

    // Revenue by month
    const revenueByMonth: Record<string, { revenue: number; expenses: number }> = {};

    for (let month = 0; month < 12; month++) {
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      revenueByMonth[monthKey] = { revenue: 0, expenses: 0 };
    }

    payments.forEach((payment) => {
      const monthKey = payment.paymentDate.toISOString().slice(0, 7);
      if (revenueByMonth[monthKey]) {
        revenueByMonth[monthKey].revenue += parseFloat(payment.amount.toString());
      }
    });

    expenses.forEach((expense) => {
      const monthKey = expense.expenseDate.toISOString().slice(0, 7);
      if (revenueByMonth[monthKey]) {
        revenueByMonth[monthKey].expenses += parseFloat(expense.amount.toString());
      }
    });

    // Revenue by property
    const properties = await prisma.property.findMany({
      where: {
        userId: session.user.id,
        ...(propertyId && { id: propertyId }),
      },
      select: {
        id: true,
        name: true,
      },
    });

    const revenueByProperty = properties.map((property) => {
      const propertyPayments = payments.filter((p) => p.booking?.propertyId === property.id);
      const propertyExpenses = expenses.filter((e) => e.propertyId === property.id);

      const revenue = propertyPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const expenseTotal = propertyExpenses.reduce(
        (sum, e) => sum + parseFloat(e.amount.toString()),
        0
      );

      return {
        property: {
          id: property.id,
          name: property.name,
        },
        revenue,
        expenses: expenseTotal,
        netIncome: revenue - expenseTotal,
        profitMargin: revenue > 0 ? ((revenue - expenseTotal) / revenue) * 100 : 0,
      };
    });

    // Revenue by payment type
    const revenueByType: Record<string, number> = {};
    payments.forEach((payment) => {
      const type = payment.paymentType;
      revenueByType[type] = (revenueByType[type] || 0) + parseFloat(payment.amount.toString());
    });

    // Revenue by booking source
    const revenueBySource: Record<string, number> = {};
    payments.forEach((payment) => {
      const source = payment.booking?.source || 'DIRECT';
      revenueBySource[source] =
        (revenueBySource[source] || 0) + parseFloat(payment.amount.toString());
    });

    // Expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((expense) => {
      const category = expense.category;
      expensesByCategory[category] =
        (expensesByCategory[category] || 0) + parseFloat(expense.amount.toString());
    });

    // Year-over-year comparison
    const prevYearStart = new Date(yearInt - 1, 0, 1);
    const prevYearEnd = new Date(yearInt - 1, 11, 31, 23, 59, 59);

    const prevYearPayments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        status: 'PAID',
        paymentDate: {
          gte: prevYearStart,
          lte: prevYearEnd,
        },
      },
      select: { amount: true },
    });

    const prevYearRevenue = prevYearPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    );

    const yoyGrowth =
      prevYearRevenue > 0 ? ((totalRevenue - prevYearRevenue) / prevYearRevenue) * 100 : 0;

    // Top performing properties
    const topProperties = revenueByProperty.sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Monthly averages
    const monthsWithRevenue = Object.values(revenueByMonth).filter((m) => m.revenue > 0).length;
    const averageMonthlyRevenue = monthsWithRevenue > 0 ? totalRevenue / monthsWithRevenue : 0;
    const averageMonthlyExpenses = monthsWithRevenue > 0 ? totalExpenses / monthsWithRevenue : 0;

    return NextResponse.json({
      summary: {
        year: yearInt,
        totalRevenue,
        totalExpenses,
        netIncome,
        profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
        averageMonthlyRevenue: Math.round(averageMonthlyRevenue * 100) / 100,
        averageMonthlyExpenses: Math.round(averageMonthlyExpenses * 100) / 100,
        yoyGrowth: Math.round(yoyGrowth * 10) / 10,
        previousYearRevenue: prevYearRevenue,
      },
      byMonth: Object.entries(revenueByMonth)
        .map(([month, data]) => ({
          month,
          revenue: Math.round(data.revenue * 100) / 100,
          expenses: Math.round(data.expenses * 100) / 100,
          netIncome: Math.round((data.revenue - data.expenses) * 100) / 100,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      byProperty: revenueByProperty.map((p) => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
        expenses: Math.round(p.expenses * 100) / 100,
        netIncome: Math.round(p.netIncome * 100) / 100,
        profitMargin: Math.round(p.profitMargin * 10) / 10,
      })),
      byPaymentType: Object.entries(revenueByType).map(([type, amount]) => ({
        type,
        amount: Math.round(amount * 100) / 100,
      })),
      bySource: Object.entries(revenueBySource).map(([source, amount]) => ({
        source,
        amount: Math.round(amount * 100) / 100,
      })),
      expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
      })),
      topProperties,
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue report' }, { status: 500 });
  }
}
