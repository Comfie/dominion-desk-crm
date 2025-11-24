import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List documents in a specific folder
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: folderId } = await params;

    // Verify folder access
    const folderWhere: Record<string, unknown> = { id: folderId };

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

      folderWhere.tenantId = tenantProfile.id;
    } else {
      folderWhere.userId = session.user.id;
    }

    const folder = await prisma.documentFolder.findFirst({
      where: folderWhere,
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 404 });
    }

    // Get documents in this folder
    const documents = await prisma.document.findMany({
      where: { folderId: folderId },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST - Upload document to a specific folder
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only landlords can upload documents
    if (session.user.role === 'TENANT') {
      return NextResponse.json({ error: 'Tenants cannot upload documents' }, { status: 403 });
    }

    const { id: folderId } = await params;

    // Verify folder ownership
    const folder = await prisma.documentFolder.findFirst({
      where: {
        id: folderId,
        userId: session.user.id,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found or does not belong to you' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      documentType,
      category,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      propertyId,
      tenantId,
      issueDate,
      expiryDate,
      isPublic,
    } = body;

    // Validate required fields
    if (!title || !documentType || !fileUrl || !fileName || !fileSize || !mimeType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        folderId: folderId,
        title,
        description,
        documentType,
        category,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        propertyId: propertyId || null,
        tenantId: tenantId || null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isPublic: isPublic || false,
        uploadedBy: session.user.id,
      },
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

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Document creation error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
