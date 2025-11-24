import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Get folder structure for a specific tenant (landlord only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tenantId } = await params;

    // Verify tenant belongs to landlord
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        userId: session.user.id,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found or does not belong to you' },
        { status: 404 }
      );
    }

    const folders = await prisma.documentFolder.findMany({
      where: {
        tenantId: tenantId,
        userId: session.user.id,
      },
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
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Tenant folders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant folders' }, { status: 500 });
  }
}
