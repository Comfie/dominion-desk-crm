import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/tasks/[id] - Get a single task
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Fetch related entity details if linked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let relatedEntity: any = null;
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

    return NextResponse.json({
      ...task,
      relatedEntity,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
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
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
