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

// Query params schema
const listQuerySchema = z.object({
  category: z.string().optional(),
  taskType: z.enum(taskTypeValues).optional(),
  includeSystem: z.coerce.boolean().default(true),
  onlySystem: z.coerce.boolean().default(false),
});

// Create template schema
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional().nullable(),
  taskType: z.enum(taskTypeValues),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  category: z.string().optional().nullable(),
  checklist: z.array(checklistItemSchema).optional().nullable(),
});

/**
 * GET /api/tasks/templates - Get all task templates
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = listQuerySchema.parse({
      category: searchParams.get('category') || undefined,
      taskType: searchParams.get('taskType') || undefined,
      includeSystem: searchParams.get('includeSystem') ?? true,
      onlySystem: searchParams.get('onlySystem') ?? false,
    });

    // Build where clause
    const where: {
      OR?: Array<{ userId: string } | { isSystem: boolean }>;
      isSystem?: boolean;
      category?: string;
      taskType?: (typeof taskTypeValues)[number];
    } = {};

    if (params.onlySystem) {
      where.isSystem = true;
    } else if (params.includeSystem) {
      // Show user's templates and system templates
      where.OR = [{ userId: session.user.id }, { isSystem: true }];
    } else {
      // Only user's templates
      where.OR = [{ userId: session.user.id }];
    }

    if (params.category) {
      where.category = params.category;
    }

    if (params.taskType) {
      where.taskType = params.taskType;
    }

    const templates = await prisma.taskTemplate.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { category: 'asc' }, { name: 'asc' }],
    });

    // Group by category for easier UI rendering
    const categories = templates.reduce(
      (acc, template) => {
        const cat = template.category || 'other';
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(template);
        return acc;
      },
      {} as Record<string, typeof templates>
    );

    return NextResponse.json({
      data: templates,
      categories,
      total: templates.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

/**
 * POST /api/tasks/templates - Create a new task template
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    // Normalize checklist with sort orders
    const checklist = data.checklist
      ? data.checklist.map((item, index) => ({
          ...item,
          sortOrder: item.sortOrder !== 0 ? item.sortOrder : index,
        }))
      : undefined;

    const template = await prisma.taskTemplate.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description || null,
        taskType: data.taskType,
        priority: data.priority,
        category: data.category || null,
        checklist: checklist,
        isSystem: false,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
