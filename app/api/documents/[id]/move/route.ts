import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT - Move document to a different folder
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only landlords can move documents
    if (session.user.role === 'TENANT') {
      return NextResponse.json({ error: 'Tenants cannot move documents' }, { status: 403 });
    }

    const { id: documentId } = await params;
    const body = await request.json();
    const { folderId } = body;

    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or does not belong to you' },
        { status: 404 }
      );
    }

    // If folderId is provided (not null), verify folder ownership
    if (folderId) {
      const folder = await prisma.documentFolder.findFirst({
        where: {
          id: folderId,
          userId: session.user.id,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Target folder not found or does not belong to you' },
          { status: 404 }
        );
      }
    }

    // Move document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: { folderId: folderId || null },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Document move error:', error);
    return NextResponse.json({ error: 'Failed to move document' }, { status: 500 });
  }
}
