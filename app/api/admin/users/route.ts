import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tier = searchParams.get('tier');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      role: 'CUSTOMER', // Only show CUSTOMER role users (landlords)
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (tier) {
      where.subscriptionTier = tier;
    }

    if (status) {
      where.subscriptionStatus = status;
    }

    // Get users with counts
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          accountType: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          isActive: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          _count: {
            select: {
              properties: true,
              bookings: true,
              tenants: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate MRR for each user
    const usersWithMRR = users.map((user) => {
      let mrr = 0;
      if (user.subscriptionStatus === 'ACTIVE') {
        switch (user.subscriptionTier) {
          case 'STARTER':
            mrr = 199;
            break;
          case 'PROFESSIONAL':
            mrr = 499;
            break;
          case 'ENTERPRISE':
            mrr = 999;
            break;
          default:
            mrr = 0;
        }
      }

      return {
        ...user,
        mrr,
        propertiesCount: user._count.properties,
        bookingsCount: user._count.bookings,
        tenantsCount: user._count.tenants,
      };
    });

    return NextResponse.json({
      users: usersWithMRR,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
