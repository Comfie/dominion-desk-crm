import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

const tenantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
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
  tenantType: z.enum(['GUEST', 'TENANT', 'BOTH']).default('TENANT'),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.tenantType = type;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        properties: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = tenantSchema.parse(body);

    // Check if tenant with same email already exists for this user
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        userId: session.user.id,
        email: validatedData.email,
      },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'A tenant with this email already exists' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.create({
      data: {
        userId: session.user.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        alternatePhone: validatedData.alternatePhone,
        idNumber: validatedData.idNumber,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        currentAddress: validatedData.currentAddress,
        city: validatedData.city,
        province: validatedData.province,
        postalCode: validatedData.postalCode,
        employmentStatus: validatedData.employmentStatus,
        employer: validatedData.employer,
        employerPhone: validatedData.employerPhone,
        monthlyIncome: validatedData.monthlyIncome,
        emergencyContactName: validatedData.emergencyContactName,
        emergencyContactPhone: validatedData.emergencyContactPhone,
        emergencyContactRelation: validatedData.emergencyContactRelation,
        tenantType: validatedData.tenantType,
        notes: validatedData.notes,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}
