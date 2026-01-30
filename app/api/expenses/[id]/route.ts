import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { expenseService, updateExpenseSchema, expenseIdSchema } from '@/lib/features/expenses';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

/**
 * GET /api/expenses/[id] - Get a single expense
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    expenseIdSchema.parse({ id });

    // Use service layer - handles ownership verification
    const expense = await expenseService.getById(id, session.user.id);

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
  }
}

/**
 * PUT /api/expenses/[id] - Update an expense
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    expenseIdSchema.parse({ id });

    const body = await request.json();
    const validatedData = updateExpenseSchema.parse(body);

    // Use service layer - handles ownership verification
    const expense = await expenseService.update(id, session.user.id, {
      propertyId: validatedData.propertyId,
      maintenanceRequestId: validatedData.maintenanceRequestId,
      category: validatedData.category,
      amount: validatedData.amount,
      expenseDate: validatedData.expenseDate,
      description: validatedData.description,
      vendor: validatedData.vendor,
      receiptUrl: validatedData.receiptUrl,
      notes: validatedData.notes,
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

/**
 * DELETE /api/expenses/[id] - Delete an expense
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    expenseIdSchema.parse({ id });

    // Use service layer - handles ownership verification
    await expenseService.delete(id, session.user.id);

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
