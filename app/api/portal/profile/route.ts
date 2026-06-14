import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTenantForPortalSession } from '@/lib/tenant-session';

const updateTenantProfileSchema = z.object({
  phone: z.string().trim().min(1, 'Phone is required'),
  alternatePhone: z.string().optional().nullable(),
  currentAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
});

function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.accountType !== 'TENANT') {
      return NextResponse.json(
        { error: 'Access denied - tenant account required' },
        { status: 403 }
      );
    }

    const tenantProfile = await getTenantForPortalSession(session.user.id, session.user.email);

    if (!tenantProfile) {
      return NextResponse.json({ error: 'No tenant record found for this email' }, { status: 404 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantProfile.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        alternatePhone: true,
        idNumber: true,
        idType: true,
        dateOfBirth: true,
        currentAddress: true,
        city: true,
        province: true,
        postalCode: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    return NextResponse.json({
      tenant: {
        ...tenant,
        dateOfBirth: tenant.dateOfBirth ? tenant.dateOfBirth.toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Tenant profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.accountType !== 'TENANT') {
      return NextResponse.json(
        { error: 'Access denied - tenant account required' },
        { status: 403 }
      );
    }

    const tenantProfile = await getTenantForPortalSession(session.user.id, session.user.email);

    if (!tenantProfile) {
      return NextResponse.json({ error: 'No tenant record found for this email' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateTenantProfileSchema.parse(body);

    const tenant = await prisma.tenant.update({
      where: { id: tenantProfile.id },
      data: {
        phone: validatedData.phone.trim(),
        alternatePhone: normalizeOptionalString(validatedData.alternatePhone),
        currentAddress: normalizeOptionalString(validatedData.currentAddress),
        city: normalizeOptionalString(validatedData.city),
        province: normalizeOptionalString(validatedData.province),
        postalCode: normalizeOptionalString(validatedData.postalCode),
        emergencyContactName: normalizeOptionalString(validatedData.emergencyContactName),
        emergencyContactPhone: normalizeOptionalString(validatedData.emergencyContactPhone),
        emergencyContactRelation: normalizeOptionalString(validatedData.emergencyContactRelation),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        alternatePhone: true,
        idNumber: true,
        idType: true,
        dateOfBirth: true,
        currentAddress: true,
        city: true,
        province: true,
        postalCode: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
      },
    });

    return NextResponse.json({
      tenant: {
        ...tenant,
        dateOfBirth: tenant.dateOfBirth ? tenant.dateOfBirth.toISOString() : null,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Tenant profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
