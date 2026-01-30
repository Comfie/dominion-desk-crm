import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Update schema
const updateChecklistItemSchema = z.object({
  item: z.string().min(1).optional(),
  isCompleted: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * GET /api/tasks/[id]/checklist/[itemId] - Get a single checklist item
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId, itemId } = await params;

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const item = await prisma.taskChecklist.findFirst({
      where: { id: itemId, taskId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching checklist item:', error);
    return NextResponse.json({ error: 'Failed to fetch checklist item' }, { status: 500 });
  }
}

/**
 * PATCH /api/tasks/[id]/checklist/[itemId] - Update a checklist item
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId, itemId } = await params;
    const body = await request.json();
    const data = updateChecklistItemSchema.parse(body);

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check item exists and belongs to this task
    const existingItem = await prisma.taskChecklist.findFirst({
      where: { id: itemId, taskId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    // Track completion
    let completedAt = existingItem.completedAt;
    let completedBy = existingItem.completedBy;

    if (data.isCompleted !== undefined) {
      if (data.isCompleted && !existingItem.isCompleted) {
        completedAt = new Date();
        completedBy = session.user.id;
      } else if (!data.isCompleted && existingItem.isCompleted) {
        completedAt = null;
        completedBy = null;
      }
    }

    const updatedItem = await prisma.taskChecklist.update({
      where: { id: itemId },
      data: {
        item: data.item,
        isCompleted: data.isCompleted,
        isRequired: data.isRequired,
        sortOrder: data.sortOrder,
        completedAt,
        completedBy,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error updating checklist item:', error);
    return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id]/checklist/[itemId] - Delete a checklist item
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId, itemId } = await params;

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check item exists and belongs to this task
    const existingItem = await prisma.taskChecklist.findFirst({
      where: { id: itemId, taskId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    await prisma.taskChecklist.delete({ where: { id: itemId } });

    return NextResponse.json({ message: 'Checklist item deleted successfully' });
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    return NextResponse.json({ error: 'Failed to delete checklist item' }, { status: 500 });
  }
}
