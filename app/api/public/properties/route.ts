import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');

    const where: Record<string, unknown> = {
      status: { in: ['ACTIVE', 'OCCUPIED'] },
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (type) {
      where.propertyType = type;
    }

    if (bedrooms) {
      where.bedrooms = { gte: parseInt(bedrooms) };
    }

    if (minPrice || maxPrice) {
      where.OR = [
        {
          monthlyRent: {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) }),
          },
        },
        {
          dailyRate: {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) }),
          },
        },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      select: {
        id: true,
        name: true,
        propertyType: true,
        address: true,
        city: true,
        province: true,
        bedrooms: true,
        bathrooms: true,
        monthlyRent: true,
        dailyRate: true,
        primaryImageUrl: true,
        rentalType: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error('Public properties fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
