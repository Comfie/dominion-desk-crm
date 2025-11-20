import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/tasks - Get all tasks for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const taskType = searchParams.get('taskType');
    const relatedType = searchParams.get('relatedType');
    const relatedId = searchParams.get('relatedId');
    const assignedTo = searchParams.get('assignedTo');
    const dueBefore = searchParams.get('dueBefore');
    const dueAfter = searchParams.get('dueAfter');

    const where = {
      userId: session.user.id,
      ...(status && { status: status as 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' }),
      ...(priority && { priority: priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' }),
      ...(taskType && { taskType: taskType as any }),
      ...(relatedType && { relatedType }),
      ...(relatedId && { relatedId }),
      ...(assignedTo && { assignedTo }),
      ...(dueBefore && { dueDate: { lte: new Date(dueBefore) } }),
      ...(dueAfter && { dueDate: { gte: new Date(dueAfter) } }),
    };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    // Get summary statistics
    const [total, todo, inProgress, completed, overdue] = await Promise.all([
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
      tasks,
      summary: {
        total,
        todo,
        inProgress,
        completed,
        overdue,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.taskType) {
      return NextResponse.json({ error: 'Title and task type are required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description || null,
        taskType: data.taskType,
        priority: data.priority || 'NORMAL',
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        relatedType: data.relatedType || null,
        relatedId: data.relatedId || null,
        status: data.status || 'TODO',
        reminderDate: data.reminderDate ? new Date(data.reminderDate) : null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
