import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Get specific integration details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = await params;

    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: platform.toUpperCase(),
        },
      },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({
      integration: {
        id: integration.id,
        platform: integration.platform,
        isActive: integration.isActive,
        syncEnabled: integration.syncEnabled,
        lastSyncAt: integration.lastSyncAt,
        status: integration.status,
        errorMessage: integration.errorMessage,
        connectedAt: integration.connectedAt,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching integration:', error);
    return NextResponse.json({ error: 'Failed to fetch integration' }, { status: 500 });
  }
}

// PATCH - Update integration settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = await params;
    const { isActive, syncEnabled, apiKey, accessToken, refreshToken } = await request.json();

    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: platform.toUpperCase(),
        },
      },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const updated = await prisma.integration.update({
      where: { id: integration.id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(syncEnabled !== undefined && { syncEnabled }),
        ...(apiKey && { apiKey }),
        ...(accessToken && { accessToken }),
        ...(refreshToken && { refreshToken }),
      },
    });

    return NextResponse.json({
      message: 'Integration updated successfully',
      integration: {
        id: updated.id,
        platform: updated.platform,
        isActive: updated.isActive,
        syncEnabled: updated.syncEnabled,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
  }
}

// DELETE - Disconnect integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = await params;

    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: platform.toUpperCase(),
        },
      },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Update to disconnected state (keep record for potential reconnection)
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        isActive: false,
        status: 'DISCONNECTED',
        accessToken: null,
        refreshToken: null,
        apiKey: null,
        syncEnabled: false,
      },
    });

    return NextResponse.json({
      message: 'Integration disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 });
  }
}
