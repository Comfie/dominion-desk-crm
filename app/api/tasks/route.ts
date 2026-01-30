import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { TaskType } from '@prisma/client';
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

// Query params schema
const listQuerySchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  taskType: z.enum(taskTypeValues).optional(),
  relatedType: z.string().optional(),
  relatedId: z.string().optional(),
  assignedTo: z.string().optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Create task schema
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  taskType: z.enum(taskTypeValues),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  assignedTo: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  relatedType: z.string().optional().nullable(),
  relatedId: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('TODO'),
  reminderDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/tasks - Get all tasks for the user
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = listQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      taskType: searchParams.get('taskType') || undefined,
      relatedType: searchParams.get('relatedType') || undefined,
      relatedId: searchParams.get('relatedId') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      dueBefore: searchParams.get('dueBefore') || undefined,
      dueAfter: searchParams.get('dueAfter') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const where = {
      userId: session.user.id,
      ...(params.status && { status: params.status }),
      ...(params.priority && { priority: params.priority }),
      ...(params.taskType && { taskType: params.taskType }),
      ...(params.relatedType && { relatedType: params.relatedType }),
      ...(params.relatedId && { relatedId: params.relatedId }),
      ...(params.assignedTo && { assignedTo: params.assignedTo }),
      ...(params.dueBefore && { dueDate: { lte: new Date(params.dueBefore) } }),
      ...(params.dueAfter && { dueDate: { gte: new Date(params.dueAfter) } }),
    };

    const [tasks, total, totalTasks, todo, inProgress, completed, overdue] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.task.count({ where }),
      prisma.task.count({ where: { userId: session.user.id } }),
      prisma.task.count({ where: { userId: session.user.id, status: 'TODO' } }),
      prisma.task.count({ where: { userId: session.user.id, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { userId: session.user.id, status: 'COMPLETED' } }),
      prisma.task.count({
        where: {
          userId: session.user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return NextResponse.json({
      data: tasks,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
      summary: { total: totalTasks, todo, inProgress, completed, overdue },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description || null,
        taskType: data.taskType,
        priority: data.priority,
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        relatedType: data.relatedType || null,
        relatedId: data.relatedId || null,
        status: data.status,
        reminderDate: data.reminderDate ? new Date(data.reminderDate) : null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
