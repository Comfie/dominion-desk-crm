import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { getBankingDetails } from '@/lib/services/banking-encryption.service';
import { getPaymentSettings } from '@/lib/services/system-settings.service';
import { getTenantForPortalSession } from '@/lib/tenant-session';
import { allowMockTenantPayments } from '@/lib/features/payments/utils/mock-payments';

/**
 * GET /api/tenant/payments/[id]
 * Get a specific payment for the logged-in tenant
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id: paymentId } = await params;

    // Check if user is a tenant
    if (session.user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Unauthorized - Tenants only' }, { status: 403 });
    }

    // Find tenant record for this user
    const tenant = await getTenantForPortalSession(session.user.id, session.user.email);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    // Get the payment and verify it belongs to this tenant
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId: tenant.id,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or does not belong to you' },
        { status: 404 }
      );
    }

    const paystackIntegration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: payment.user.id,
          platform: 'PAYSTACK',
        },
      },
    });

    // Get encrypted banking details for the landlord
    const bankingDetails = await getBankingDetails(payment.user.id);

    // Get payment settings (transaction fee)
    const paymentSettings = await getPaymentSettings();

    // Combine payment with banking details and settings
    const response = {
      ...payment,
      user: {
        ...payment.user,
        bankName: bankingDetails?.bankName || null,
        bankAccountName: bankingDetails?.bankAccountName || null,
        bankAccountNumber: bankingDetails?.bankAccountNumber || null,
        bankBranchCode: bankingDetails?.bankBranchCode || null,
        bankSwiftCode: bankingDetails?.bankSwiftCode || null,
        paymentInstructions: bankingDetails?.paymentInstructions || null,
      },
      transactionFeePercentage: paymentSettings.onlineTransactionFeePercentage,
      onlinePaymentAvailable: Boolean(
        (paystackIntegration?.status === 'CONNECTED' && paystackIntegration.apiKey) ||
        allowMockTenantPayments()
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
  }
}
