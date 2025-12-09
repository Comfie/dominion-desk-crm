import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List folders for a tenant or current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const propertyId = searchParams.get('propertyId');

    const where: Record<string, unknown> = {};

    // If user is a tenant, only show their folders
    if (session.user.role === 'TENANT') {
      if (!session.user.email) {
        return NextResponse.json({ error: 'User email not found' }, { status: 400 });
      }

      // Find tenant profile by email
      const tenantProfile = await prisma.tenant.findFirst({
        where: {
          email: session.user.email,
        },
      });

      if (!tenantProfile) {
        return NextResponse.json({ error: 'Tenant profile not found' }, { status: 404 });
      }

      where.tenantId = tenantProfile.id;
    } else {
      // Landlord view - filter by userId and optional tenantId
      where.userId = session.user.id;

      if (tenantId) {
        where.tenantId = tenantId;
      }

      if (propertyId) {
        where.propertyId = propertyId;
      }
    }

    // Only fetch root-level folders (parentFolderId is null)
    // and include their subfolders recursively to avoid duplicates
    const folders = await prisma.documentFolder.findMany({
      where: {
        ...where,
        parentFolderId: null, // Only root-level folders
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
        // Recursively include subfolders
        subFolders: {
          include: {
            _count: {
              select: {
                documents: true,
                subFolders: true,
              },
            },
            subFolders: {
              include: {
                _count: {
                  select: {
                    documents: true,
                    subFolders: true,
                  },
                },
                subFolders: {
                  include: {
                    _count: {
                      select: {
                        documents: true,
                        subFolders: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Folders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

// POST - Create new folder (landlord only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only landlords can create folders
    if (session.user.role === 'TENANT') {
      return NextResponse.json({ error: 'Tenants cannot create folders' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, color, icon, tenantId, propertyId, parentFolderId, sortOrder } =
      body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // If tenantId is provided, verify it belongs to the landlord
    if (tenantId) {
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
    }

    const folder = await prisma.documentFolder.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
        tenantId: tenantId || null,
        propertyId: propertyId || null,
        parentFolderId: parentFolderId || null,
        sortOrder: sortOrder || 0,
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

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Folder creation error:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
