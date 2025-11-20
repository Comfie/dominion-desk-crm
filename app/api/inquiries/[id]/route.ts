import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

const updateInquirySchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESPONDED', 'CONVERTED', 'CLOSED', 'SPAM']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  response: z.string().optional(),
  followUpDate: z.string().optional().nullable(),
  followUpNotes: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const inquiry = await prisma.inquiry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            primaryImageUrl: true,
            dailyRate: true,
            monthlyRent: true,
          },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiry' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify inquiry belongs to user
    const existingInquiry = await prisma.inquiry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingInquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateInquirySchema.parse(body);

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    if (validatedData.priority) {
      updateData.priority = validatedData.priority;
    }

    if (validatedData.response !== undefined) {
      updateData.response = validatedData.response;
      updateData.respondedAt = new Date();
      updateData.respondedBy = session.user.id;
      if (!validatedData.status) {
        updateData.status = 'RESPONDED';
      }
    }

    if (validatedData.followUpDate !== undefined) {
      updateData.followUpDate = validatedData.followUpDate
        ? new Date(validatedData.followUpDate)
        : null;
    }

    if (validatedData.followUpNotes !== undefined) {
      updateData.followUpNotes = validatedData.followUpNotes;
    }

    if (validatedData.assignedTo !== undefined) {
      updateData.assignedTo = validatedData.assignedTo;
    }

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(inquiry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error updating inquiry:', error);
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify inquiry belongs to user
    const inquiry = await prisma.inquiry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    await prisma.inquiry.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    return NextResponse.json({ error: 'Failed to delete inquiry' }, { status: 500 });
  }
}
