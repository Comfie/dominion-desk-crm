import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// TaskType values from Prisma schema
const taskTypeValues = [
  'FOLLOW_UP',
  'VIEWING',
  'CHECK_IN',
  'CHECK_OUT',
  'INSPECTION',
  'MAINTENANCE',
  'PAYMENT_REMINDER',
  'LEASE_RENEWAL',
  'OTHER',
] as const;

// ID validation
const taskIdSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
});

// Update task schema
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  taskType: z.enum(taskTypeValues).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  relatedType: z.string().optional().nullable(),
  relatedId: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  reminderDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/tasks/[id] - Get a single task
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    taskIdSchema.parse({ id });

    const task = await prisma.task.findFirst({
      where: { id, userId: session.user.id },
      include: {
        checklist: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Calculate checklist progress
    const checklistProgress =
      task.checklist.length > 0
        ? {
            total: task.checklist.length,
            completed: task.checklist.filter((item) => item.isCompleted).length,
            percentage: Math.round(
              (task.checklist.filter((item) => item.isCompleted).length / task.checklist.length) *
                100
            ),
          }
        : null;

    // Fetch related entity details if linked
    let relatedEntity: Record<string, unknown> | null = null;
    if (task.relatedType && task.relatedId) {
      switch (task.relatedType) {
        case 'property':
          relatedEntity = await prisma.property.findUnique({
            where: { id: task.relatedId },
            select: { id: true, name: true, address: true },
          });
          break;
        case 'booking':
          relatedEntity = await prisma.booking.findUnique({
            where: { id: task.relatedId },
            select: {
              id: true,
              guestName: true,
              checkInDate: true,
              checkOutDate: true,
              property: { select: { id: true, name: true } },
            },
          });
          break;
        case 'tenant':
          relatedEntity = await prisma.tenant.findUnique({
            where: { id: task.relatedId },
            select: { id: true, firstName: true, lastName: true, email: true },
          });
          break;
        case 'maintenance':
          relatedEntity = await prisma.maintenanceRequest.findUnique({
            where: { id: task.relatedId },
            select: {
              id: true,
              title: true,
              status: true,
              property: { select: { id: true, name: true } },
            },
          });
          break;
      }
    }

    return NextResponse.json({ ...task, relatedEntity, checklistProgress });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

/**
 * PUT /api/tasks/[id] - Update a task
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    taskIdSchema.parse({ id });

    const body = await request.json();
    const data = updateTaskSchema.parse(body);

    // Check ownership
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Track completion date
    let completedDate = existingTask.completedDate;
    if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      completedDate = new Date();
    } else if (data.status && data.status !== 'COMPLETED') {
      completedDate = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        taskType: data.taskType,
        priority: data.priority,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
        status: data.status,
        completedDate,
        reminderDate: data.reminderDate ? new Date(data.reminderDate) : null,
        notes: data.notes,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id] - Delete a task
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    taskIdSchema.parse({ id });

    const existingTask = await prisma.task.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
