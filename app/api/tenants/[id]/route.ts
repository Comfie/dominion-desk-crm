import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

const updateTenantSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  currentAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  employmentStatus: z
    .enum(['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'STUDENT'])
    .optional()
    .nullable(),
  employer: z.string().optional().nullable(),
  employerPhone: z.string().optional().nullable(),
  monthlyIncome: z.number().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
  tenantType: z.enum(['GUEST', 'TENANT', 'BOTH']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED']).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        properties: {
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
          },
          orderBy: { leaseStartDate: 'desc' },
        },
        bookings: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { checkInDate: 'desc' },
          take: 10,
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 10,
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify tenant belongs to user
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateTenantSchema.parse(body);

    // Check for duplicate email if email is being updated
    if (validatedData.email && validatedData.email !== existingTenant.email) {
      const duplicateEmail = await prisma.tenant.findFirst({
        where: {
          userId: session.user.id,
          email: validatedData.email,
          id: { not: id },
        },
      });

      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'A tenant with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.firstName) updateData.firstName = validatedData.firstName;
    if (validatedData.lastName) updateData.lastName = validatedData.lastName;
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.alternatePhone !== undefined)
      updateData.alternatePhone = validatedData.alternatePhone;
    if (validatedData.idNumber !== undefined) updateData.idNumber = validatedData.idNumber;
    if (validatedData.dateOfBirth !== undefined)
      updateData.dateOfBirth = validatedData.dateOfBirth
        ? new Date(validatedData.dateOfBirth)
        : null;
    if (validatedData.currentAddress !== undefined)
      updateData.currentAddress = validatedData.currentAddress;
    if (validatedData.city !== undefined) updateData.city = validatedData.city;
    if (validatedData.province !== undefined) updateData.province = validatedData.province;
    if (validatedData.postalCode !== undefined) updateData.postalCode = validatedData.postalCode;
    if (validatedData.employmentStatus !== undefined)
      updateData.employmentStatus = validatedData.employmentStatus;
    if (validatedData.employer !== undefined) updateData.employer = validatedData.employer;
    if (validatedData.employerPhone !== undefined)
      updateData.employerPhone = validatedData.employerPhone;
    if (validatedData.monthlyIncome !== undefined)
      updateData.monthlyIncome = validatedData.monthlyIncome;
    if (validatedData.emergencyContactName !== undefined)
      updateData.emergencyContactName = validatedData.emergencyContactName;
    if (validatedData.emergencyContactPhone !== undefined)
      updateData.emergencyContactPhone = validatedData.emergencyContactPhone;
    if (validatedData.emergencyContactRelation !== undefined)
      updateData.emergencyContactRelation = validatedData.emergencyContactRelation;
    if (validatedData.tenantType) updateData.tenantType = validatedData.tenantType;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(tenant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error updating tenant:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    await prisma.tenant.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 });
  }
}
