import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/expenses/[id] - Get a single expense
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
  }
}

// PUT /api/expenses/[id] - Update an expense
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if expense exists and belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        propertyId: data.propertyId,
        title: data.title,
        description: data.description,
        category: data.category,
        amount: data.amount,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
        vendor: data.vendor,
        vendorInvoice: data.vendorInvoice,
        receiptUrl: data.receiptUrl,
        isDeductible: data.isDeductible,
        status: data.status,
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        notes: data.notes,
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

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

// DELETE /api/expenses/[id] - Delete an expense
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if expense exists and belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
