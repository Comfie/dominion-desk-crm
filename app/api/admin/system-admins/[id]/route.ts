import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only super admins can update admin accounts.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    // Prevent self-deactivation
    if (session.user.id === id && isActive === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own admin account.' },
        { status: 400 }
      );
    }

    // Verify the user exists and is an admin
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    if (targetUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Target user is not an admin' }, { status: 400 });
    }

    // Update admin user
    const updatedAdmin = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Failed to update admin account' }, { status: 500 });
  }
}
