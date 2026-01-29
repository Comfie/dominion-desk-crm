import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const createValuationSchema = z.object({
  valuationAmount: z.number().positive('Valuation amount must be positive'),
  valuationType: z.enum(['PURCHASE', 'MARKET', 'MUNICIPAL', 'INSURANCE', 'BANK']),
  valuedBy: z.string().optional(),
  valuationDate: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
  documentUrl: z.string().url().optional().nullable(),
});

// GET - List all valuations for a property
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId } = await params;

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

    const valuations = await prisma.propertyValuation.findMany({
      where: { propertyId },
      orderBy: { valuationDate: 'desc' },
    });

    return NextResponse.json(valuations);
  } catch (error) {
    console.error('Error fetching valuations:', error);
    return NextResponse.json({ error: 'Failed to fetch valuations' }, { status: 500 });
  }
}

// POST - Add a new valuation
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId } = await params;
    const body = await request.json();
    const validatedData = createValuationSchema.parse(body);

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

    // Create the valuation
    const valuation = await prisma.propertyValuation.create({
      data: {
        propertyId,
        valuationAmount: validatedData.valuationAmount,
        valuationType: validatedData.valuationType,
        valuedBy: validatedData.valuedBy,
        valuationDate: validatedData.valuationDate,
        notes: validatedData.notes,
        documentUrl: validatedData.documentUrl,
      },
    });

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
    const updateData: Record<string, unknown> = {};

    // Always update currentValuation to the most recent valuation by date
    if (latestValuation) {
      updateData.currentValuation = latestValuation.valuationAmount;
      updateData.lastValuationDate = latestValuation.valuationDate;
    }

    // Set purchase fields from the purchase valuation
    if (purchaseValuation) {
      updateData.purchasePrice = purchaseValuation.valuationAmount;
      updateData.purchaseDate = purchaseValuation.valuationDate;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.property.update({
        where: { id: propertyId },
        data: updateData,
      });
    }

    return NextResponse.json(valuation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error creating valuation:', error);
    return NextResponse.json({ error: 'Failed to create valuation' }, { status: 500 });
  }
}
