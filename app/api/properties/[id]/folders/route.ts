import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createDefaultFoldersForProperty } from '@/lib/document-folders';

// GET - Get folder structure for a specific property (landlord only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId } = await params;

    // Verify property belongs to landlord
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Get folders that belong specifically to this property (not tenant folders)
    let folders = await prisma.documentFolder.findMany({
      where: {
        propertyId: propertyId,
        tenantId: null, // Important: only get property-specific folders, not tenant folders
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            documents: true,
            subFolders: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // If no folders exist for this property, create default folders
    if (folders.length === 0) {
      await createDefaultFoldersForProperty(prisma, session.user.id, propertyId);

      // Fetch the newly created folders
      folders = await prisma.documentFolder.findMany({
        where: {
          propertyId: propertyId,
          tenantId: null,
          userId: session.user.id,
        },
        include: {
          _count: {
            select: {
              documents: true,
              subFolders: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
    }

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Property folders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch property folders' }, { status: 500 });
  }
}
