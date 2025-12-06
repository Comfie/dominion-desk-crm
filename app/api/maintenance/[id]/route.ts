import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { maintenanceService } from '@/lib/features/maintenance/services/maintenance.service';

const updateMaintenanceSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z
    .enum([
      'PLUMBING',
      'ELECTRICAL',
      'HVAC',
      'APPLIANCE',
      'STRUCTURAL',
      'PAINTING',
      'CLEANING',
      'LANDSCAPING',
      'PEST_CONTROL',
      'SECURITY',
      'OTHER',
    ])
    .optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  location: z.string().optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
  completedDate: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  actualCost: z.number().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  resolutionNotes: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  feedback: z.string().optional().nullable(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
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
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        expenses: {
          select: {
            id: true,
            title: true,
            amount: true,
            category: true,
            expenseDate: true,
            status: true,
            vendor: true,
          },
          orderBy: {
            expenseDate: 'desc',
          },
        },
      },
    });

    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance request' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify request belongs to user
    const existingRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateMaintenanceSchema.parse(body);

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.category) updateData.category = validatedData.category;
    if (validatedData.priority) updateData.priority = validatedData.priority;
    if (validatedData.status) {
      updateData.status = validatedData.status;
      // Auto-set assignedAt when scheduling
      if (validatedData.status === 'SCHEDULED' && validatedData.assignedTo) {
        updateData.assignedAt = new Date();
      }
    }
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.scheduledDate !== undefined) {
      updateData.scheduledDate = validatedData.scheduledDate
        ? new Date(validatedData.scheduledDate)
        : null;
    }
    if (validatedData.completedDate !== undefined) {
      updateData.completedDate = validatedData.completedDate
        ? new Date(validatedData.completedDate)
        : null;
    }
    if (validatedData.estimatedCost !== undefined)
      updateData.estimatedCost = validatedData.estimatedCost;
    if (validatedData.actualCost !== undefined) updateData.actualCost = validatedData.actualCost;
    if (validatedData.assignedTo !== undefined) updateData.assignedTo = validatedData.assignedTo;
    if (validatedData.resolutionNotes !== undefined)
      updateData.resolutionNotes = validatedData.resolutionNotes;
    if (validatedData.rating !== undefined) updateData.rating = validatedData.rating;
    if (validatedData.feedback !== undefined) updateData.feedback = validatedData.feedback;

    const maintenanceRequest = await prisma.maintenanceRequest.update({
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

    // If status changed, send email notification
    if (validatedData.status && validatedData.status !== existingRequest.status) {
      try {
        await maintenanceService.updateStatus(
          id,
          session.user.id,
          validatedData.status,
          validatedData.resolutionNotes || undefined
        );
      } catch (emailError) {
        console.error('Failed to send status change email:', emailError);
        // Continue - don't fail the request if email fails
      }
    }

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error updating maintenance request:', error);
    return NextResponse.json({ error: 'Failed to update maintenance request' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify request belongs to user
    const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    await prisma.maintenanceRequest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    return NextResponse.json({ error: 'Failed to delete maintenance request' }, { status: 500 });
  }
}
