import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import {
  getBankingDetails,
  saveBankingDetails,
  deleteBankingDetails,
} from '@/lib/services/banking-encryption.service';

/**
 * GET /api/settings/banking
 * Get encrypted banking details for the logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Only allow landlords/customers and admins
    if (session.user.role !== 'CUSTOMER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only landlords can access banking details' },
        { status: 403 }
      );
    }

    const bankingDetails = await getBankingDetails(session.user.id);

    if (!bankingDetails) {
      return NextResponse.json({
        hasBankingDetails: false,
        bankingDetails: null,
      });
    }

    return NextResponse.json({
      hasBankingDetails: true,
      bankingDetails,
    });
  } catch (error) {
    console.error('Error fetching banking details:', error);
    return NextResponse.json({ error: 'Failed to fetch banking details' }, { status: 500 });
  }
}

/**
 * POST /api/settings/banking
 * Save or update encrypted banking details
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Only allow landlords/customers and admins
    if (session.user.role !== 'CUSTOMER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only landlords can update banking details' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      bankName,
      bankAccountName,
      bankAccountNumber,
      bankBranchCode,
      bankSwiftCode,
      paymentInstructions,
    } = body;

    // Validate required fields
    if (!bankName || !bankAccountName || !bankAccountNumber || !bankBranchCode) {
      return NextResponse.json(
        {
          error: 'Bank name, account name, account number, and branch code are required',
        },
        { status: 400 }
      );
    }

    // Save encrypted banking details
    await saveBankingDetails(session.user.id, {
      bankName,
      bankAccountName,
      bankAccountNumber,
      bankBranchCode,
      bankSwiftCode: bankSwiftCode || undefined,
      paymentInstructions: paymentInstructions || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Banking details saved securely',
    });
  } catch (error) {
    console.error('Error saving banking details:', error);
    return NextResponse.json({ error: 'Failed to save banking details' }, { status: 500 });
  }
}

/**
 * DELETE /api/settings/banking
 * Delete banking details
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Only allow landlords/customers and admins
    if (session.user.role !== 'CUSTOMER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only landlords can delete banking details' },
        { status: 403 }
      );
    }

    await deleteBankingDetails(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Banking details deleted',
    });
  } catch (error) {
    console.error('Error deleting banking details:', error);
    return NextResponse.json({ error: 'Failed to delete banking details' }, { status: 500 });
  }
}
