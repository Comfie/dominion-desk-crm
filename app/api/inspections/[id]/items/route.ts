import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const createItemSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  itemName: z.string().min(1, 'Item name is required'),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']),
  notes: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  actionRequired: z.boolean().default(false),
  actionNotes: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
});

const updateItemSchema = createItemSchema.partial();

// GET - List all items for an inspection
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: inspectionId } = await params;

    // Verify inspection belongs to user
    const inspection = await prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        userId: session.user.id,
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const items = await prisma.inspectionItem.findMany({
      where: { inspectionId },
      orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching inspection items:', error);
    return NextResponse.json({ error: 'Failed to fetch inspection items' }, { status: 500 });
  }
}

// POST - Add a new item to an inspection
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: inspectionId } = await params;
    const body = await request.json();
    const validatedData = createItemSchema.parse(body);

    // Verify inspection belongs to user
    const inspection = await prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        userId: session.user.id,
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const item = await prisma.inspectionItem.create({
      data: {
        inspectionId,
        category: validatedData.category,
        itemName: validatedData.itemName,
        condition: validatedData.condition,
        notes: validatedData.notes,
        photos: validatedData.photos === null ? Prisma.JsonNull : validatedData.photos,
        actionRequired: validatedData.actionRequired,
        actionNotes: validatedData.actionNotes,
        estimatedCost: validatedData.estimatedCost,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error creating inspection item:', error);
    return NextResponse.json({ error: 'Failed to create inspection item' }, { status: 500 });
  }
}

// PUT - Bulk update items
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: inspectionId } = await params;
    const body = await request.json();

    // Verify inspection belongs to user
    const inspection = await prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        userId: session.user.id,
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    // Expect body to be an array of items with id and updates
    const itemsToUpdate = z
      .array(
        z.object({
          id: z.string(),
          ...updateItemSchema.shape,
        })
      )
      .parse(body.items);

    const updates = await prisma.$transaction(
      itemsToUpdate.map((item) =>
        prisma.inspectionItem.update({
          where: { id: item.id },
          data: {
            category: item.category,
            itemName: item.itemName,
            condition: item.condition,
            notes: item.notes,
            photos: item.photos === null ? Prisma.JsonNull : item.photos,
            actionRequired: item.actionRequired,
            actionNotes: item.actionNotes,
            estimatedCost: item.estimatedCost,
          },
        })
      )
    );

    return NextResponse.json(updates);
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error updating inspection items:', error);
    return NextResponse.json({ error: 'Failed to update inspection items' }, { status: 500 });
  }
}
