import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { expenseService, createExpenseSchema, listExpensesSchema } from '@/lib/features/expenses';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

/**
 * GET /api/expenses - List all expenses with pagination and filters
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Parse and validate filters
    const filters = listExpensesSchema.parse({
      propertyId: searchParams.get('propertyId') || undefined,
      maintenanceRequestId: searchParams.get('maintenanceRequestId') || undefined,
      category: searchParams.get('category') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      search: searchParams.get('search') || undefined,
    });

    // Use service layer
    const expenses = await expenseService.list(session.user.id, filters);

    // Apply pagination
    const total = expenses.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = expenses.slice(startIndex, startIndex + limit);

    // Calculate summary
    const summary = {
      totalAmount: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
      unpaidAmount: expenses
        .filter((e) => e.status === 'UNPAID' || e.status === 'OVERDUE')
        .reduce((sum, e) => sum + Number(e.amount), 0),
      paidAmount: expenses
        .filter((e) => e.status === 'PAID')
        .reduce((sum, e) => sum + Number(e.amount), 0),
      deductibleAmount: expenses
        .filter((e) => e.isDeductible)
        .reduce((sum, e) => sum + Number(e.amount), 0),
      count: expenses.length,
      byCategory: expenses.reduce(
        (acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

/**
 * POST /api/expenses - Create a new expense
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createExpenseSchema.parse(body);

    // Use service layer - handles property/maintenance request verification
    const expense = await expenseService.create(session.user.id, {
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

    return NextResponse.json(expense, { status: 201 });
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

    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
