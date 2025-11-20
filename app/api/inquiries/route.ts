import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { notifyNewInquiry } from '@/lib/notifications';

const inquirySchema = z.object({
  propertyId: z.string().optional().nullable(),
  inquirySource: z
    .enum([
      'DIRECT',
      'AIRBNB',
      'BOOKING_COM',
      'WEBSITE',
      'PHONE',
      'EMAIL',
      'WHATSAPP',
      'REFERRAL',
      'OTHER',
    ])
    .default('DIRECT'),
  inquiryType: z
    .enum(['BOOKING', 'VIEWING', 'GENERAL', 'COMPLAINT', 'MAINTENANCE'])
    .default('BOOKING'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Invalid email'),
  contactPhone: z.string().optional().nullable(),
  message: z.string().min(1, 'Message is required'),
  checkInDate: z.string().optional().nullable(),
  checkOutDate: z.string().optional().nullable(),
  numberOfGuests: z.number().optional().nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const source = searchParams.get('source');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (source) {
      where.inquirySource = source;
    }

    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = inquirySchema.parse(body);

    // Verify property belongs to user if provided
    if (validatedData.propertyId) {
      const property = await prisma.property.findFirst({
        where: {
          id: validatedData.propertyId,
          userId: session.user.id,
        },
      });

      if (!property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        userId: session.user.id,
        propertyId: validatedData.propertyId,
        inquirySource: validatedData.inquirySource,
        inquiryType: validatedData.inquiryType,
        contactName: validatedData.contactName,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone,
        message: validatedData.message,
        checkInDate: validatedData.checkInDate ? new Date(validatedData.checkInDate) : null,
        checkOutDate: validatedData.checkOutDate ? new Date(validatedData.checkOutDate) : null,
        numberOfGuests: validatedData.numberOfGuests,
        priority: validatedData.priority,
        status: 'NEW',
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create notification for new inquiry
    try {
      await notifyNewInquiry(
        session.user.id,
        validatedData.contactName,
        inquiry.property?.name || null,
        inquiry.id
      );
    } catch (notifyError) {
      console.error('Failed to create notification:', notifyError);
    }

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error creating inquiry:', error);
    return NextResponse.json({ error: 'Failed to create inquiry' }, { status: 500 });
  }
}
