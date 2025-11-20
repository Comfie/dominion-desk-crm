import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const inquirySchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  message: z.string().optional(),
  preferredMoveIn: z.string().optional(),
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
        inquiryType: 'BOOKING',
        status: 'NEW',
        checkInDate: validatedData.preferredMoveIn ? new Date(validatedData.preferredMoveIn) : null,
      },
    });

    // TODO: Send email notification to property owner
    // This would integrate with an email service like SendGrid, Resend, etc.
    // For now, we'll just log it
    console.log(`New inquiry for property ${property.name}:`, {
      inquiryId: inquiry.id,
      from: validatedData.name,
      email: validatedData.email,
      ownerEmail: property.user.email,
    });

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
