import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const updateValuationSchema = z.object({
  valuationAmount: z.number().positive('Valuation amount must be positive').optional(),
  valuationType: z.enum(['PURCHASE', 'MARKET', 'MUNICIPAL', 'INSURANCE', 'BANK']).optional(),
  valuedBy: z.string().optional().nullable(),
  valuationDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  notes: z.string().optional().nullable(),
});

// Helper to recalculate property valuation fields
async function recalculatePropertyValuation(propertyId: string) {
  // Find the most recent valuation (by valuation date, then by createdAt for same-day tiebreaking)
  const latestValuation = await prisma.propertyValuation.findFirst({
    where: { propertyId },
    orderBy: [{ valuationDate: 'desc' }, { createdAt: 'desc' }],
  });

  // Find the PURCHASE type valuation for purchase price
  const purchaseValuation = await prisma.propertyValuation.findFirst({
    where: {
      propertyId,
      valuationType: 'PURCHASE',
    },
    orderBy: [{ valuationDate: 'desc' }, { createdAt: 'desc' }],
  });

  // Update property with correct values
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      currentValuation: latestValuation?.valuationAmount || null,
      lastValuationDate: latestValuation?.valuationDate || null,
      purchasePrice: purchaseValuation?.valuationAmount || null,
      purchaseDate: purchaseValuation?.valuationDate || null,
    },
  });
}

// GET - Get a single valuation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; valuationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId, valuationId } = await params;

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const valuation = await prisma.propertyValuation.findFirst({
      where: {
        id: valuationId,
        propertyId,
      },
    });

    if (!valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 });
    }

    return NextResponse.json(valuation);
  } catch (error) {
    console.error('Error fetching valuation:', error);
    return NextResponse.json({ error: 'Failed to fetch valuation' }, { status: 500 });
  }
}

// PUT - Update a valuation
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; valuationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId, valuationId } = await params;
    const body = await request.json();
    const validatedData = updateValuationSchema.parse(body);

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check if valuation exists
    const existingValuation = await prisma.propertyValuation.findFirst({
      where: {
        id: valuationId,
        propertyId,
      },
    });

    if (!existingValuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 });
    }

    // Update the valuation
    const valuation = await prisma.propertyValuation.update({
      where: { id: valuationId },
      data: validatedData,
    });

    // Recalculate property valuation fields
    await recalculatePropertyValuation(propertyId);

    return NextResponse.json(valuation);
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error updating valuation:', error);
    return NextResponse.json({ error: 'Failed to update valuation' }, { status: 500 });
  }
}

// DELETE - Delete a valuation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; valuationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId, valuationId } = await params;

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check if valuation exists
    const existingValuation = await prisma.propertyValuation.findFirst({
      where: {
        id: valuationId,
        propertyId,
      },
    });

    if (!existingValuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 });
    }

    // Delete the valuation
    await prisma.propertyValuation.delete({
      where: { id: valuationId },
    });

    // Recalculate property valuation fields
    await recalculatePropertyValuation(propertyId);

    return NextResponse.json({ message: 'Valuation deleted successfully' });
  } catch (error) {
    console.error('Error deleting valuation:', error);
    return NextResponse.json({ error: 'Failed to delete valuation' }, { status: 500 });
  }
}
