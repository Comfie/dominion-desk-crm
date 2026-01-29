import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const updateInspectionSchema = z.object({
  inspectionType: z
    .enum(['MOVE_IN', 'MOVE_OUT', 'ROUTINE', 'MAINTENANCE', 'ANNUAL', 'PRE_PURCHASE'])
    .optional(),
  scheduledDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  completedDate: z
    .string()
    .transform((str) => new Date(str))
    .optional()
    .nullable(),
  inspector: z.string().optional().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  overallCondition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']).optional().nullable(),
  overallNotes: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional().nullable(),
});

// GET - Get a single inspection
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const inspection = await prisma.inspection.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true, city: true },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        items: {
          orderBy: { category: 'asc' },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    return NextResponse.json(inspection);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    return NextResponse.json({ error: 'Failed to fetch inspection' }, { status: 500 });
  }
}

// PUT - Update an inspection
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateInspectionSchema.parse(body);

    // Verify inspection exists and belongs to user
    const existingInspection = await prisma.inspection.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingInspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const inspection = await prisma.inspection.update({
      where: { id },
      data: {
        ...validatedData,
        photos: validatedData.photos ?? undefined,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true },
        },
        items: true,
      },
    });

    return NextResponse.json(inspection);
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error updating inspection:', error);
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 });
  }
}

// DELETE - Delete an inspection
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify inspection exists and belongs to user
    const existingInspection = await prisma.inspection.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingInspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    await prisma.inspection.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 });
  }
}
