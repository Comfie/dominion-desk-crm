import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { maintenanceImageSchema } from '@/lib/features/maintenance/dtos/maintenance.dto';
import { notifyMaintenanceRequest } from '@/lib/notifications';
import { getTenantForPortalSession } from '@/lib/tenant-session';

const maintenanceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.string().min(1, 'Priority is required'),
  images: z.array(maintenanceImageSchema).max(5, 'Maximum 5 photos allowed').optional(),
});

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
        properties: {
          where: { isActive: true },
          select: {
            propertyId: true,
            property: {
              select: {
                name: true,
                address: true,
                city: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        location: true,
        scheduledDate: true,
        completedDate: true,
        resolutionNotes: true,
        images: true,
        createdAt: true,
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = requests.reduce(
      (acc, request) => {
        acc.total += 1;
        if (request.status === 'PENDING') acc.pending += 1;
        if (request.status === 'SCHEDULED') acc.scheduled += 1;
        if (request.status === 'IN_PROGRESS') acc.inProgress += 1;
        if (request.status === 'COMPLETED') acc.completed += 1;
        if (request.status === 'CANCELLED') acc.cancelled += 1;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
      }
    );

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: `${tenant.firstName} ${tenant.lastName}`,
      },
      property: tenant.properties[0]
        ? {
            id: tenant.properties[0].propertyId,
            name: tenant.properties[0].property.name,
            address: tenant.properties[0].property.address,
            city: tenant.properties[0].property.city,
          }
        : null,
      requests,
      summary,
    });
  } catch (error) {
    console.error('Tenant maintenance fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    // Find tenant record matching user's email
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantProfile.id },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        properties: {
          where: { isActive: true },
          select: {
            propertyId: true,
            property: {
              select: {
                name: true,
                userId: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    const propertyId = tenant.properties[0]?.propertyId;
    if (!propertyId) {
      return NextResponse.json({ error: 'No property assigned to this tenant' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = maintenanceSchema.parse(body);

    const activeProperty = tenant.properties[0];

    // Create the maintenance request
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        propertyId,
        userId: tenant.userId,
        tenantId: tenant.id,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category as
          | 'PLUMBING'
          | 'ELECTRICAL'
          | 'HVAC'
          | 'APPLIANCE'
          | 'STRUCTURAL'
          | 'PAINTING'
          | 'CLEANING'
          | 'LANDSCAPING'
          | 'PEST_CONTROL'
          | 'SECURITY'
          | 'OTHER',
        priority: validatedData.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
        images: validatedData.images ?? [],
        status: 'PENDING',
      },
    });

    // Send notification to property manager
    try {
      if (activeProperty) {
        await notifyMaintenanceRequest(
          activeProperty.property.userId,
          validatedData.title,
          activeProperty.property.name,
          maintenanceRequest.id
        );
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Maintenance request submitted successfully',
      requestId: maintenanceRequest.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Tenant maintenance request error:', error);
    return NextResponse.json({ error: 'Failed to submit maintenance request' }, { status: 500 });
  }
}
