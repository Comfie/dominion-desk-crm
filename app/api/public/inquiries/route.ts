import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { notifyNewInquiry } from '@/lib/notifications';

const inquirySchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  message: z.string().optional(),
  preferredMoveIn: z.string().optional(),
  preferredMoveOut: z.string().optional(),
  numberOfGuests: z.coerce.number().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = inquirySchema.parse(body);

    // Get the property and its owner
    const property = await prisma.property.findUnique({
      where: { id: validatedData.propertyId },
      select: {
        id: true,
        name: true,
        userId: true,
        rentalType: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Determine inquiry type based on property rental type
    let inquiryType: 'BOOKING' | 'VIEWING' | 'GENERAL' = 'GENERAL';
    if (property.rentalType === 'SHORT_TERM') {
      inquiryType = 'BOOKING';
    } else if (property.rentalType === 'LONG_TERM') {
      inquiryType = 'VIEWING';
    } else if (property.rentalType === 'BOTH') {
      // If property supports both, use BOOKING if dates provided, otherwise VIEWING
      inquiryType =
        validatedData.preferredMoveIn && validatedData.preferredMoveOut ? 'BOOKING' : 'VIEWING';
    }

    // Create the inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId: validatedData.propertyId,
        userId: property.userId,
        contactName: validatedData.name,
        contactEmail: validatedData.email,
        contactPhone: validatedData.phone,
        message: validatedData.message || `Inquiry about ${property.name}`,
        inquirySource: 'WEBSITE',
        inquiryType,
        status: 'NEW',
        checkInDate: validatedData.preferredMoveIn ? new Date(validatedData.preferredMoveIn) : null,
        checkOutDate: validatedData.preferredMoveOut
          ? new Date(validatedData.preferredMoveOut)
          : null,
        numberOfGuests: validatedData.numberOfGuests || null,
      },
    });

    // Send notification to property owner
    try {
      await notifyNewInquiry(property.userId, validatedData.name, property.name, inquiry.id);
    } catch (notificationError) {
      console.error('Failed to send inquiry notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry submitted successfully',
      inquiryId: inquiry.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Public inquiry error:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
