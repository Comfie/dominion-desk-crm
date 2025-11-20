import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/expenses - List all expenses
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isDeductible = searchParams.get('isDeductible');

    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        ...(propertyId && { propertyId }),
        ...(category && {
          category: category as
            | 'MAINTENANCE'
            | 'UTILITIES'
            | 'INSURANCE'
            | 'PROPERTY_TAX'
            | 'MORTGAGE'
            | 'CLEANING'
            | 'SUPPLIES'
            | 'ADVERTISING'
            | 'PROFESSIONAL_FEES'
            | 'MANAGEMENT_FEE'
            | 'OTHER',
        }),
        ...(status && { status: status as 'UNPAID' | 'PAID' | 'OVERDUE' }),
        ...(isDeductible && { isDeductible: isDeductible === 'true' }),
        ...(startDate &&
          endDate && {
            expenseDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });

    // Calculate summary statistics
    const summary = {
      totalAmount: expenses.reduce((sum: number, e) => sum + Number(e.amount), 0),
      unpaidAmount: expenses
        .filter((e) => e.status === 'UNPAID' || e.status === 'OVERDUE')
        .reduce((sum: number, e) => sum + Number(e.amount), 0),
      paidAmount: expenses
        .filter((e) => e.status === 'PAID')
        .reduce((sum: number, e) => sum + Number(e.amount), 0),
      deductibleAmount: expenses
        .filter((e) => e.isDeductible)
        .reduce((sum: number, e) => sum + Number(e.amount), 0),
      count: expenses.length,
      byCategory: expenses.reduce(
        (acc: Record<string, number>, e) => {
          acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return NextResponse.json({ expenses, summary });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        propertyId: data.propertyId || null,
        title: data.title,
        description: data.description || null,
        category: data.category,
        amount: data.amount,
        currency: data.currency || 'ZAR',
        expenseDate: new Date(data.expenseDate),
        vendor: data.vendor || null,
        vendorInvoice: data.vendorInvoice || null,
        receiptUrl: data.receiptUrl || null,
        isDeductible: data.isDeductible || false,
        status: data.status || 'UNPAID',
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        notes: data.notes || null,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
