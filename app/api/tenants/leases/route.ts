import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    // Fetch active tenant leases
    const leases = await prisma.propertyTenant.findMany({
      where: {
        isActive: true,
        property: {
          userId: session.user.id,
        },
        ...(propertyId && { propertyId }),
      },
      include: {
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
            rentalType: true,
          },
        },
      },
      orderBy: { leaseStartDate: 'desc' },
    });

    return NextResponse.json(leases);
  } catch (error) {
    console.error('Error fetching tenant leases:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant leases' }, { status: 500 });
  }
}
