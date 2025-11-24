import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Get single folder
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: folderId } = await params;

    const where: Record<string, unknown> = { id: folderId };

    // If user is a tenant, verify they own this folder
    if (session.user.role === 'TENANT') {
      if (!session.user.email) {
        return NextResponse.json({ error: 'User email not found' }, { status: 400 });
      }

      const tenantProfile = await prisma.tenant.findFirst({
        where: { email: session.user.email },
      });

      if (!tenantProfile) {
        return NextResponse.json({ error: 'Tenant profile not found' }, { status: 404 });
      }

      where.tenantId = tenantProfile.id;
    } else {
      // Landlord - verify ownership
      where.userId = session.user.id;
    }

    const folder = await prisma.documentFolder.findFirst({
      where,
      include: {
        _count: {
          select: {
            documents: true,
            subFolders: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Folder fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch folder' }, { status: 500 });
  }
}

// PUT - Update folder (landlord only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only landlords can update folders
    if (session.user.role === 'TENANT') {
      return NextResponse.json({ error: 'Tenants cannot update folders' }, { status: 403 });
    }

    const { id: folderId } = await params;
    const body = await request.json();
    const { name, description, color, icon, sortOrder } = body;

    // Verify folder ownership
    const existingFolder = await prisma.documentFolder.findFirst({
      where: {
        id: folderId,
        userId: session.user.id,
      },
    });

    if (!existingFolder) {
      return NextResponse.json(
        { error: 'Folder not found or does not belong to you' },
        { status: 404 }
      );
    }

    const updatedFolder = await prisma.documentFolder.update({
      where: { id: folderId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        color: color !== undefined ? color : undefined,
        icon: icon !== undefined ? icon : undefined,
        sortOrder: sortOrder !== undefined ? sortOrder : undefined,
      },
      include: {
        _count: {
          select: {
            documents: true,
            subFolders: true,
          },
        },
      },
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error('Folder update error:', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

// DELETE - Delete folder (landlord only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only landlords can delete folders
    if (session.user.role === 'TENANT') {
      return NextResponse.json({ error: 'Tenants cannot delete folders' }, { status: 403 });
    }

    const { id: folderId } = await params;
    const { searchParams } = new URL(request.url);
    const moveToFolderId = searchParams.get('moveToFolderId'); // Optional: move docs to another folder

    // Verify folder ownership
    const folder = await prisma.documentFolder.findFirst({
      where: {
        id: folderId,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found or does not belong to you' },
        { status: 404 }
      );
    }

    // If folder has documents, handle them
    if (folder._count.documents > 0) {
      if (moveToFolderId) {
        // Move documents to another folder
        await prisma.document.updateMany({
          where: { folderId: folderId },
          data: { folderId: moveToFolderId },
        });
      } else {
        // Set documents to null (uncategorized)
        await prisma.document.updateMany({
          where: { folderId: folderId },
          data: { folderId: null },
        });
      }
    }

    // Delete the folder
    await prisma.documentFolder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Folder deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
