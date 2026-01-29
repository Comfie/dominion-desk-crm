import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const querySchema = z.object({
  year: z.coerce.number().min(2000).max(2100),
  propertyId: z.string().optional(),
});

// GET - Generate annual tax summary report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      year: searchParams.get('year') || new Date().getFullYear(),
      propertyId: searchParams.get('propertyId') || undefined,
    });

    const startDate = new Date(query.year, 0, 1); // January 1st
    const endDate = new Date(query.year, 11, 31, 23, 59, 59); // December 31st

    const propertyFilter = query.propertyId ? { propertyId: query.propertyId } : {};

    // Fetch all income (payments) for the year
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        status: 'PAID',
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        ...propertyFilter,
      },
      include: {
        property: { select: { id: true, name: true } },
      },
    });

    // Fetch all expenses for the year
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
        ...propertyFilter,
      },
      include: {
        property: { select: { id: true, name: true } },
      },
    });

    // Calculate income by type
    const incomeByType: Record<string, number> = {};
    let totalIncome = 0;

    payments.forEach((payment) => {
      const amount = Number(payment.amount);
      const type = payment.paymentType;
      incomeByType[type] = (incomeByType[type] || 0) + amount;
      totalIncome += amount;
    });

    // Calculate expenses by category (deductible vs non-deductible)
    const deductibleExpenses: Record<string, number> = {};
    const nonDeductibleExpenses: Record<string, number> = {};
    let totalDeductible = 0;
    let totalNonDeductible = 0;

    expenses.forEach((expense) => {
      const amount = Number(expense.amount);
      const category = expense.category;

      if (expense.isDeductible) {
        deductibleExpenses[category] = (deductibleExpenses[category] || 0) + amount;
        totalDeductible += amount;
      } else {
        nonDeductibleExpenses[category] = (nonDeductibleExpenses[category] || 0) + amount;
        totalNonDeductible += amount;
      }
    });

    // Calculate income by property
    const incomeByProperty: Record<string, { name: string; amount: number }> = {};
    payments.forEach((payment) => {
      if (payment.property) {
        const propertyId = payment.property.id;
        if (!incomeByProperty[propertyId]) {
          incomeByProperty[propertyId] = { name: payment.property.name, amount: 0 };
        }
        incomeByProperty[propertyId].amount += Number(payment.amount);
      }
    });

    // Calculate expenses by property
    const expensesByProperty: Record<
      string,
      { name: string; deductible: number; nonDeductible: number }
    > = {};
    expenses.forEach((expense) => {
      if (expense.property) {
        const propertyId = expense.property.id;
        if (!expensesByProperty[propertyId]) {
          expensesByProperty[propertyId] = {
            name: expense.property.name,
            deductible: 0,
            nonDeductible: 0,
          };
        }
        if (expense.isDeductible) {
          expensesByProperty[propertyId].deductible += Number(expense.amount);
        } else {
          expensesByProperty[propertyId].nonDeductible += Number(expense.amount);
        }
      }
    });

    // Monthly breakdown for income and expenses
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(query.year, i, 1).toLocaleString('default', { month: 'short' }),
      income: 0,
      deductibleExpenses: 0,
      nonDeductibleExpenses: 0,
      netIncome: 0,
    }));

    payments.forEach((payment) => {
      if (payment.paymentDate) {
        const month = payment.paymentDate.getMonth();
        monthlyBreakdown[month].income += Number(payment.amount);
      }
    });

    expenses.forEach((expense) => {
      const month = expense.expenseDate.getMonth();
      if (expense.isDeductible) {
        monthlyBreakdown[month].deductibleExpenses += Number(expense.amount);
      } else {
        monthlyBreakdown[month].nonDeductibleExpenses += Number(expense.amount);
      }
    });

    // Calculate net income per month
    monthlyBreakdown.forEach((month) => {
      month.netIncome = month.income - month.deductibleExpenses - month.nonDeductibleExpenses;
    });

    // Net taxable income calculation
    const netTaxableIncome = totalIncome - totalDeductible;

    // Get properties for context
    const properties = await prisma.property.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, address: true, purchasePrice: true, purchaseDate: true },
    });

    return NextResponse.json({
      year: query.year,
      summary: {
        totalIncome,
        totalDeductibleExpenses: totalDeductible,
        totalNonDeductibleExpenses: totalNonDeductible,
        totalExpenses: totalDeductible + totalNonDeductible,
        netTaxableIncome,
        netProfit: totalIncome - totalDeductible - totalNonDeductible,
      },
      incomeByType,
      deductibleExpenses,
      nonDeductibleExpenses,
      incomeByProperty: Object.values(incomeByProperty),
      expensesByProperty: Object.values(expensesByProperty),
      monthlyBreakdown,
      properties,
      metadata: {
        generatedAt: new Date().toISOString(),
        paymentsCount: payments.length,
        expensesCount: expenses.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error generating tax summary:', error);
    return NextResponse.json({ error: 'Failed to generate tax summary' }, { status: 500 });
  }
}
