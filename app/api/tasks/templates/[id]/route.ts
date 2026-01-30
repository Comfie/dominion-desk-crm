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

// Checklist item schema for templates
const checklistItemSchema = z.object({
  item: z.string().min(1),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

// Update template schema
const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  taskType: z.enum(taskTypeValues).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  category: z.string().optional().nullable(),
  checklist: z.array(checklistItemSchema).optional().nullable(),
});

/**
 * GET /api/tasks/templates/[id] - Get a single template
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.taskTemplate.findFirst({
      where: {
        id,
        OR: [{ userId: session.user.id }, { isSystem: true }],
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

/**
 * PUT /api/tasks/templates/[id] - Update a template
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateTemplateSchema.parse(body);

    // Check template exists and user has permission
    const existingTemplate = await prisma.taskTemplate.findFirst({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Can't modify system templates
    if (existingTemplate.isSystem) {
      return NextResponse.json({ error: 'Cannot modify system templates' }, { status: 403 });
    }

    // Must own the template
    if (existingTemplate.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Normalize checklist with sort orders
    const checklist = data.checklist?.map((item, index) => ({
      ...item,
      sortOrder: item.sortOrder !== 0 ? item.sortOrder : index,
    }));

    const template = await prisma.taskTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        taskType: data.taskType,
        priority: data.priority,
        category: data.category,
        checklist: checklist !== undefined ? checklist : undefined,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/templates/[id] - Delete a template
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingTemplate = await prisma.taskTemplate.findFirst({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Can't delete system templates
    if (existingTemplate.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 });
    }

    // Must own the template
    if (existingTemplate.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.taskTemplate.delete({ where: { id } });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}

/**
 * POST /api/tasks/templates/[id] - Create a task from this template
 * This creates a new task with the template's settings and checklist items
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get the template
    const template = await prisma.taskTemplate.findFirst({
      where: {
        id,
        OR: [{ userId: session.user.id }, { isSystem: true }],
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create task with template settings, allowing overrides from body
    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: body.title || template.name,
        description: body.description || template.description,
        taskType: template.taskType,
        priority: body.priority || template.priority,
        assignedTo: body.assignedTo || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        relatedType: body.relatedType || null,
        relatedId: body.relatedId || null,
        status: 'TODO',
        reminderDate: body.reminderDate ? new Date(body.reminderDate) : null,
        notes: body.notes || null,
      },
    });

    // Create checklist items from template
    if (template.checklist && Array.isArray(template.checklist)) {
      const checklistItems = (
        template.checklist as Array<{
          item: string;
          isRequired: boolean;
          sortOrder: number;
        }>
      ).map((item, index) => ({
        taskId: task.id,
        item: item.item,
        isRequired: item.isRequired || false,
        sortOrder: item.sortOrder ?? index,
      }));

      if (checklistItems.length > 0) {
        await prisma.taskChecklist.createMany({
          data: checklistItems,
        });
      }
    }

    // Fetch the complete task with checklist
    const completeTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        checklist: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(completeTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task from template:', error);
    return NextResponse.json({ error: 'Failed to create task from template' }, { status: 500 });
  }
}
