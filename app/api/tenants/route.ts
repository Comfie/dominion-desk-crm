import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { createDefaultFoldersForTenant } from '@/lib/document-folders';
import { sendEmail, emailTemplates } from '@/lib/email';
import { generateTenantPassword } from '@/lib/password-generator';

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
  // Portal access fields
  createPortalAccess: z.boolean().optional().default(false),
  // Property assignment fields
  assignProperty: z.boolean().optional().default(false),
  propertyId: z.string().optional().nullable(),
  leaseStartDate: z.string().optional().nullable(),
  leaseEndDate: z.string().optional().nullable(),
  propertyMonthlyRent: z.number().optional().nullable(),
  propertyDepositPaid: z.number().optional().nullable(),
  propertyMoveInDate: z.string().optional().nullable(),
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

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
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.tenant.count({ where }),
    ]);

    return NextResponse.json({
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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

    // No validation needed - password will be auto-generated if portal access requested

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

    // Check if user account with this email already exists if creating portal access
    if (validatedData.createPortalAccess) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user account with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Create tenant record (always owned by property manager)
    const tenant = await prisma.tenant.create({
      data: {
        userId: session.user.id, // Always link to property manager for ownership
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
        monthlyIncome: validatedData.monthlyIncome
          ? new Prisma.Decimal(validatedData.monthlyIncome)
          : null,
        emergencyContactName: validatedData.emergencyContactName,
        emergencyContactPhone: validatedData.emergencyContactPhone,
        emergencyContactRelation: validatedData.emergencyContactRelation,
        tenantType: validatedData.tenantType,
        notes: validatedData.notes,
        status: 'ACTIVE',
      },
    });

    // Auto-generate password and create portal user account if requested
    let generatedPassword: string | null = null;
    if (validatedData.createPortalAccess) {
      generatedPassword = generateTenantPassword(validatedData.firstName, validatedData.lastName);
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      await prisma.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          accountType: 'TENANT',
          role: 'TENANT',
          isActive: true,
          emailVerified: false,
          requirePasswordChange: true, // Force password change on first login
          propertyLimit: 0, // Tenants don't own properties
        },
      });
    }

    // Assign property if requested
    if (
      validatedData.assignProperty &&
      validatedData.propertyId &&
      validatedData.leaseStartDate &&
      validatedData.propertyMonthlyRent !== null &&
      validatedData.propertyMonthlyRent !== undefined
    ) {
      // Verify property belongs to user
      const property = await prisma.property.findFirst({
        where: {
          id: validatedData.propertyId,
          userId: session.user.id,
        },
      });

      if (!property) {
        return NextResponse.json(
          { error: 'Property not found or does not belong to you' },
          { status: 404 }
        );
      }

      // Check if property already has an active tenant assignment
      const existingAssignment = await prisma.propertyTenant.findFirst({
        where: {
          propertyId: validatedData.propertyId,
          isActive: true,
        },
      });

      if (existingAssignment) {
        return NextResponse.json(
          { error: 'Property already has an active tenant assignment' },
          { status: 400 }
        );
      }

      // Create property-tenant assignment
      await prisma.propertyTenant.create({
        data: {
          userId: session.user.id,
          propertyId: validatedData.propertyId,
          tenantId: tenant.id,
          leaseStartDate: new Date(validatedData.leaseStartDate),
          leaseEndDate: validatedData.leaseEndDate ? new Date(validatedData.leaseEndDate) : null,
          monthlyRent: new Prisma.Decimal(validatedData.propertyMonthlyRent),
          depositPaid: validatedData.propertyDepositPaid
            ? new Prisma.Decimal(validatedData.propertyDepositPaid)
            : new Prisma.Decimal(0),
          moveInDate: validatedData.propertyMoveInDate
            ? new Date(validatedData.propertyMoveInDate)
            : null,
          isActive: true,
        },
      });
    }

    // Create default document folders for the tenant
    try {
      await createDefaultFoldersForTenant(
        prisma,
        session.user.id,
        tenant.id,
        validatedData.propertyId || undefined
      );
    } catch (folderError) {
      console.error('Error creating default folders:', folderError);
      // Don't fail the entire request if folder creation fails
    }

    // Send welcome email to tenant
    try {
      // Fetch landlord information
      const landlord = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      });

      const landlordName = landlord
        ? `${landlord.firstName} ${landlord.lastName}`
        : 'Your Landlord';
      const landlordEmail = landlord?.email || '';
      const landlordPhone = landlord?.phone || '';

      // Check if property was assigned
      if (validatedData.assignProperty && validatedData.propertyId) {
        // Fetch property details
        const property = await prisma.property.findUnique({
          where: { id: validatedData.propertyId },
          select: {
            name: true,
            address: true,
            city: true,
          },
        });

        if (property) {
          const propertyAddress = `${property.address}, ${property.city}`;
          const moveInDate = validatedData.propertyMoveInDate
            ? new Date(validatedData.propertyMoveInDate).toLocaleDateString('en-ZA')
            : undefined;
          const monthlyRent = validatedData.propertyMonthlyRent
            ? `R${validatedData.propertyMonthlyRent.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
            : 'TBD';
          const deposit = validatedData.propertyDepositPaid
            ? `R${validatedData.propertyDepositPaid.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
            : 'R0.00';
          const leaseStartDate = new Date(validatedData.leaseStartDate!).toLocaleDateString(
            'en-ZA'
          );
          const leaseEndDate = validatedData.leaseEndDate
            ? new Date(validatedData.leaseEndDate).toLocaleDateString('en-ZA')
            : undefined;

          if (validatedData.createPortalAccess && generatedPassword) {
            // Send email with portal access
            const emailData = emailTemplates.tenantWelcomeWithPortal({
              tenantName: `${validatedData.firstName} ${validatedData.lastName}`,
              email: validatedData.email,
              password: generatedPassword,
              landlordName,
              landlordEmail,
              landlordPhone,
              propertyName: property.name,
              propertyAddress,
              moveInDate,
              monthlyRent,
              deposit,
              leaseStartDate,
              leaseEndDate,
              loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/portal/login`,
            });

            await sendEmail({
              to: validatedData.email,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
            });
          } else {
            // Send email without portal access
            const emailData = emailTemplates.tenantWelcomeNoPortal({
              tenantName: `${validatedData.firstName} ${validatedData.lastName}`,
              landlordName,
              landlordEmail,
              landlordPhone,
              propertyName: property.name,
              propertyAddress,
              moveInDate,
              monthlyRent,
              deposit,
              leaseStartDate,
              leaseEndDate,
            });

            await sendEmail({
              to: validatedData.email,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
            });
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the entire request if email sending fails
    }

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}
