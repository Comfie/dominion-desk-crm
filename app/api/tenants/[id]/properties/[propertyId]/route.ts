import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

const updateAssignmentSchema = z.object({
  leaseStartDate: z.string().optional(),
  leaseEndDate: z.string().optional().nullable(),
  monthlyRent: z.number().min(0, 'Monthly rent must be a positive number').optional(),
  depositPaid: z.number().min(0, 'Deposit must be a positive number').optional(),
  moveInDate: z.string().optional().nullable(),
  moveOutDate: z.string().optional().nullable(),
  leaseDocumentUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const terminateLeaseSchema = z.object({
  moveOutDate: z.string().min(1, 'Move-out date is required to terminate lease'),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; propertyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, propertyId } = await params;

    // Verify tenant belongs to user
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateAssignmentSchema.parse(body);

    // Find the property-tenant assignment
    const assignment = await prisma.propertyTenant.findFirst({
      where: {
        propertyId,
        tenantId: id,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Property assignment not found' }, { status: 404 });
    }

    // Update the assignment
    const updateData: Prisma.PropertyTenantUpdateInput = {};

    if (validatedData.leaseStartDate) {
      updateData.leaseStartDate = new Date(validatedData.leaseStartDate);
    }
    if (validatedData.leaseEndDate !== undefined) {
      updateData.leaseEndDate = validatedData.leaseEndDate
        ? new Date(validatedData.leaseEndDate)
        : null;
    }
    if (validatedData.monthlyRent !== undefined) {
      updateData.monthlyRent = new Prisma.Decimal(validatedData.monthlyRent);
    }
    if (validatedData.depositPaid !== undefined) {
      updateData.depositPaid = new Prisma.Decimal(validatedData.depositPaid);
    }
    if (validatedData.moveInDate !== undefined) {
      updateData.moveInDate = validatedData.moveInDate ? new Date(validatedData.moveInDate) : null;
    }
    if (validatedData.moveOutDate !== undefined) {
      updateData.moveOutDate = validatedData.moveOutDate
        ? new Date(validatedData.moveOutDate)
        : null;
    }
    if (validatedData.leaseDocumentUrl !== undefined) {
      updateData.leaseDocumentUrl = validatedData.leaseDocumentUrl;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    const updatedAssignment = await prisma.propertyTenant.update({
      where: {
        id: assignment.id,
      },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            province: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error updating property assignment:', error);
    return NextResponse.json({ error: 'Failed to update property assignment' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; propertyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, propertyId } = await params;

    // Verify tenant belongs to user
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get move-out date from request body
    const body = await request.json();
    const { moveOutDate } = terminateLeaseSchema.parse(body);

    // Find the property-tenant assignment
    const assignment = await prisma.propertyTenant.findFirst({
      where: {
        propertyId,
        tenantId: id,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Property assignment not found' }, { status: 404 });
    }

    // Update the assignment to mark as inactive and set move-out date
    await prisma.propertyTenant.update({
      where: {
        id: assignment.id,
      },
      data: {
        isActive: false,
        moveOutDate: new Date(moveOutDate),
      },
    });

    return NextResponse.json({ message: 'Lease terminated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error terminating lease:', error);
    return NextResponse.json({ error: 'Failed to terminate lease' }, { status: 500 });
  }
}
