import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

const portalAccessSchema = z.object({
  action: z.enum(['create', 'reset', 'revoke']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
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

        if (!validatedData.password) {
          return NextResponse.json(
            { error: 'Password is required when creating portal access' },
            { status: 400 }
          );
        }

        // Check if user with this email already exists
        if (existingTenantUser) {
          return NextResponse.json(
            { error: 'A user account with this email already exists' },
            { status: 400 }
          );
        }

        // Create tenant user account (but don't link it to tenant record)
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);
        await prisma.user.create({
          data: {
            email: tenant.email,
            password: hashedPassword,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            phone: tenant.phone || '',
            accountType: 'TENANT',
            isActive: true,
            emailVerified: false,
            propertyLimit: 0,
          },
        });

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

        if (!validatedData.password) {
          return NextResponse.json(
            { error: 'New password is required when resetting portal access' },
            { status: 400 }
          );
        }

        // Update password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);
        await prisma.user.update({
          where: { email: tenant.email },
          data: { password: hashedPassword },
        });

        return NextResponse.json({
          success: true,
          message: 'Password reset successfully',
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
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
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
