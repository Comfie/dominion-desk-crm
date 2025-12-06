import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { sendEmail, emailTemplates } from '@/lib/email';
import { generateTenantPassword } from '@/lib/password-generator';

const portalAccessSchema = z.object({
  action: z.enum(['create', 'reset', 'revoke']),
});

// POST /api/tenants/[id]/portal-access - Manage portal access for tenant
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = portalAccessSchema.parse(body);

    // Find the tenant (owned by property manager)
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        userId: session.user.id, // Tenant must be owned by this property manager
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if tenant has portal access by looking for a User account with their email
    const existingTenantUser = await prisma.user.findUnique({
      where: { email: tenant.email },
    });

    const hasPortalAccess = existingTenantUser?.accountType === 'TENANT';

    // Handle different actions
    switch (validatedData.action) {
      case 'create': {
        if (hasPortalAccess) {
          return NextResponse.json({ error: 'Tenant already has portal access' }, { status: 400 });
        }

        // Check if user with this email already exists
        if (existingTenantUser) {
          return NextResponse.json(
            { error: 'A user account with this email already exists' },
            { status: 400 }
          );
        }

        // Auto-generate password
        const generatedPassword = generateTenantPassword(tenant.firstName, tenant.lastName);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Create tenant user account (but don't link it to tenant record)
        await prisma.user.create({
          data: {
            email: tenant.email,
            password: hashedPassword,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            phone: tenant.phone || '',
            accountType: 'TENANT',
            role: 'TENANT',
            isActive: true,
            emailVerified: false,
            requirePasswordChange: true, // Force password change on first login
            propertyLimit: 0,
          },
        });

        // Send welcome email with portal access
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

          // Find tenant's active property assignment
          const propertyAssignment = await prisma.propertyTenant.findFirst({
            where: {
              tenantId: tenant.id,
              isActive: true,
            },
            include: {
              property: {
                select: {
                  name: true,
                  address: true,
                  city: true,
                },
              },
            },
          });

          if (propertyAssignment && propertyAssignment.property) {
            const property = propertyAssignment.property;
            const propertyAddress = `${property.address}, ${property.city}`;
            const moveInDate = propertyAssignment.moveInDate
              ? new Date(propertyAssignment.moveInDate).toLocaleDateString('en-ZA')
              : undefined;
            const monthlyRent = `R${propertyAssignment.monthlyRent.toNumber().toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
            const deposit = `R${propertyAssignment.depositPaid.toNumber().toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
            const leaseStartDate = new Date(propertyAssignment.leaseStartDate).toLocaleDateString(
              'en-ZA'
            );
            const leaseEndDate = propertyAssignment.leaseEndDate
              ? new Date(propertyAssignment.leaseEndDate).toLocaleDateString('en-ZA')
              : undefined;

            const emailData = emailTemplates.tenantWelcomeWithPortal({
              tenantName: `${tenant.firstName} ${tenant.lastName}`,
              email: tenant.email,
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
              to: tenant.email,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
            });
          }
        } catch (emailError) {
          console.error('Error sending portal access email:', emailError);
          // Don't fail the request if email fails
        }

        return NextResponse.json({
          success: true,
          message: 'Portal access created successfully',
        });
      }

      case 'reset': {
        if (!hasPortalAccess || !existingTenantUser) {
          return NextResponse.json(
            { error: 'Tenant does not have portal access' },
            { status: 400 }
          );
        }

        // Auto-generate new password
        const generatedPassword = generateTenantPassword(tenant.firstName, tenant.lastName);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Update password
        await prisma.user.update({
          where: { email: tenant.email },
          data: { password: hashedPassword },
        });

        // TODO: Send password reset email with new credentials

        return NextResponse.json({
          success: true,
          message: 'Password reset successfully',
          password: generatedPassword, // Return new password to display to landlord
        });
      }

      case 'revoke': {
        if (!hasPortalAccess || !existingTenantUser) {
          return NextResponse.json(
            { error: 'Tenant does not have portal access' },
            { status: 400 }
          );
        }

        // Delete the tenant user account
        await prisma.user.delete({
          where: { email: tenant.email },
        });

        return NextResponse.json({
          success: true,
          message: 'Portal access revoked successfully',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error managing portal access:', error);
    return NextResponse.json(
      {
        error: 'Failed to manage portal access',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/tenants/[id]/portal-access - Check if tenant has portal access
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find the tenant (owned by property manager)
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        userId: session.user.id, // Tenant must be owned by this property manager
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if tenant has portal access by looking for a User account with their email
    const tenantUser = await prisma.user.findUnique({
      where: { email: tenant.email },
    });

    const hasPortalAccess = tenantUser?.accountType === 'TENANT';

    return NextResponse.json({
      hasPortalAccess,
      userAccountId: hasPortalAccess && tenantUser ? tenantUser.id : null,
      createdAt: hasPortalAccess && tenantUser ? tenantUser.createdAt : null,
    });
  } catch (error) {
    console.error('Error fetching portal access:', error);
    return NextResponse.json({ error: 'Failed to fetch portal access' }, { status: 500 });
  }
}
