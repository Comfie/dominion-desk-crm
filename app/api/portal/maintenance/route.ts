import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notifyMaintenanceRequest } from '@/lib/notifications';

const maintenanceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.string().min(1, 'Priority is required'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find tenant record matching user's email
    const tenant = await prisma.tenant.findFirst({
      where: { email: session.user.email },
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
      return NextResponse.json({ error: 'No tenant record found for this email' }, { status: 404 });
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
        status: 'PENDING',
      },
    });

    // Send notification to property manager
    try {
      await notifyMaintenanceRequest(
        activeProperty.property.userId,
        validatedData.title,
        activeProperty.property.name,
        maintenanceRequest.id
      );
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
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Tenant maintenance request error:', error);
    return NextResponse.json({ error: 'Failed to submit maintenance request' }, { status: 500 });
  }
}
