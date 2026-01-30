import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Schemas
const checklistItemSchema = z.object({
  item: z.string().min(1, 'Item text is required'),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const createChecklistSchema = z.object({
  items: z.array(checklistItemSchema).min(1, 'At least one item is required'),
});

const reorderChecklistSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int(),
    })
  ),
});

/**
 * GET /api/tasks/[id]/checklist - Get all checklist items for a task
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const items = await prisma.taskChecklist.findMany({
      where: { taskId },
      orderBy: { sortOrder: 'asc' },
    });

    // Calculate progress
    const totalItems = items.length;
    const completedItems = items.filter((item) => item.isCompleted).length;
    const requiredItems = items.filter((item) => item.isRequired).length;
    const completedRequiredItems = items.filter(
      (item) => item.isRequired && item.isCompleted
    ).length;

    return NextResponse.json({
      data: items,
      progress: {
        total: totalItems,
        completed: completedItems,
        percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        requiredTotal: requiredItems,
        requiredCompleted: completedRequiredItems,
        allRequiredComplete: requiredItems === completedRequiredItems,
      },
    });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
  }
}

/**
 * POST /api/tasks/[id]/checklist - Add checklist items to a task
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await request.json();

    // Support both single item and array of items
    let data: { items: Array<{ item: string; isRequired: boolean; sortOrder: number }> };
    if (body.items) {
      data = createChecklistSchema.parse(body);
    } else if (body.item) {
      data = { items: [checklistItemSchema.parse(body)] };
    } else {
      return NextResponse.json({ error: 'Item text is required' }, { status: 400 });
    }

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get current max sortOrder
    const lastItem = await prisma.taskChecklist.findFirst({
      where: { taskId },
      orderBy: { sortOrder: 'desc' },
    });
    const startSortOrder = (lastItem?.sortOrder ?? -1) + 1;

    // Create all items
    const createdItems = await prisma.taskChecklist.createMany({
      data: data.items.map((item, index) => ({
        taskId,
        item: item.item,
        isRequired: item.isRequired,
        sortOrder: item.sortOrder !== 0 ? item.sortOrder : startSortOrder + index,
      })),
    });

    // Fetch the created items to return
    const items = await prisma.taskChecklist.findMany({
      where: { taskId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ data: items, created: createdItems.count }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error creating checklist items:', error);
    return NextResponse.json({ error: 'Failed to create checklist items' }, { status: 500 });
  }
}

/**
 * PATCH /api/tasks/[id]/checklist - Reorder checklist items
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await request.json();
    const data = reorderChecklistSchema.parse(body);

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update all items in a transaction
    await prisma.$transaction(
      data.items.map((item) =>
        prisma.taskChecklist.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    const items = await prisma.taskChecklist.findMany({
      where: { taskId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error reordering checklist:', error);
    return NextResponse.json({ error: 'Failed to reorder checklist' }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id]/checklist - Delete all checklist items for a task
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.taskChecklist.deleteMany({ where: { taskId } });

    return NextResponse.json({ message: 'Checklist cleared successfully' });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    return NextResponse.json({ error: 'Failed to delete checklist' }, { status: 500 });
  }
}
