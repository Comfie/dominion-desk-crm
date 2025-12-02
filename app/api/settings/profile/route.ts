import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Get user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        photoUrl: true,
        accountType: true,
        companyName: true,
        timezone: true,
        currency: true,
        language: true,
        rentalDueDay: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        propertyLimit: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get property count
    const propertyCount = await prisma.property.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      user,
      usage: {
        properties: propertyCount,
        propertyLimit: user.propertyLimit,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      firstName,
      lastName,
      phone,
      photoUrl,
      accountType,
      companyName,
      timezone,
      currency,
      language,
      rentalDueDay,
    } = data;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(accountType && { accountType }),
        ...(companyName !== undefined && { companyName }),
        ...(timezone && { timezone }),
        ...(currency && { currency }),
        ...(language && { language }),
        ...(rentalDueDay !== undefined && { rentalDueDay }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        photoUrl: true,
        accountType: true,
        companyName: true,
        timezone: true,
        currency: true,
        language: true,
        rentalDueDay: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
