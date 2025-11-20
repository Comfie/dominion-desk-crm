import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List documents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const tenantId = searchParams.get('tenantId');
    const documentType = searchParams.get('documentType');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (documentType) {
      where.documentType = documentType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
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

// POST - Create document
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Document creation error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
