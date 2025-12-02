import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';
import { logAudit } from '@/lib/shared/audit';

const bankingSchema = z.object({
  bankName: z.string().min(1),
  bankAccountName: z.string().min(1),
  bankAccountNumber: z.string().min(1),
  bankBranchCode: z.string().optional(),
  bankSwiftCode: z.string().optional(),
  paymentInstructions: z.string().optional(),
});

/**
 * GET /api/settings/banking
 * Get current user's banking details
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.user.organizationId },
      select: {
        bankName: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankBranchCode: true,
        bankSwiftCode: true,
        paymentInstructions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching banking details:', error);
    return NextResponse.json({ error: 'Failed to fetch banking details' }, { status: 500 });
  }
}

/**
 * PUT /api/settings/banking
 * Update user's banking details
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // Validate request body
    const validatedData = bankingSchema.parse(body);

    // Get current banking details for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.organizationId },
      select: {
        bankName: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankBranchCode: true,
        bankSwiftCode: true,
        paymentInstructions: true,
      },
    });

    // Update banking details
    const updatedUser = await prisma.user.update({
      where: { id: session.user.organizationId },
      data: {
        bankName: validatedData.bankName,
        bankAccountName: validatedData.bankAccountName,
        bankAccountNumber: validatedData.bankAccountNumber,
        bankBranchCode: validatedData.bankBranchCode || null,
        bankSwiftCode: validatedData.bankSwiftCode || null,
        paymentInstructions: validatedData.paymentInstructions || null,
      },
      select: {
        bankName: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankBranchCode: true,
        bankSwiftCode: true,
        paymentInstructions: true,
      },
    });

    // Log audit trail
    await logAudit(
      session,
      'updated',
      'user',
      session.user.organizationId,
      {
        before: currentUser,
        after: updatedUser,
        field: 'banking_details',
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid banking details', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating banking details:', error);
    return NextResponse.json({ error: 'Failed to update banking details' }, { status: 500 });
  }
}
