import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { getTenantBySessionEmail } from '@/lib/tenant-session';
import { allowMockTenantPayments } from '@/lib/features/payments/utils/mock-payments';

/**
 * POST /api/tenant/payments/paystack/initialize
 * Initialize a Paystack payment for a tenant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Check if user is a tenant
    if (session.user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Unauthorized - Tenants only' }, { status: 403 });
    }

    // Find tenant record for this user
    const tenant = await getTenantBySessionEmail(session.user.email);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    const { paymentId, amount, email } = await request.json();

    if (!paymentId || !amount) {
      return NextResponse.json({ error: 'Payment ID and amount are required' }, { status: 400 });
    }

    // Verify payment belongs to this tenant
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId: tenant.id,
      },
      include: {
        user: {
          select: {
            id: true,
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

    // Check payment is in valid status
    if (payment.status !== 'PENDING' && payment.status !== 'OVERDUE') {
      return NextResponse.json({ error: 'Payment is not in a payable status' }, { status: 400 });
    }

    // Generate reference
    const reference = `PAY-${payment.paymentReference}-${Date.now()}`;

    // Get the callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/portal/payments/${paymentId}/callback`;

    // Check if landlord has Paystack configured
    const integration = await prisma.integration.findUnique({
      where: {
        userId_platform: {
          userId: payment.userId,
          platform: 'PAYSTACK',
        },
      },
    });

    // In production with Paystack configured:
    if (integration && integration.status === 'CONNECTED' && integration.apiKey) {
      try {
        const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${integration.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email || tenant.email,
            amount: Math.round(Number(amount) * 100), // Paystack uses kobo/cents
            reference,
            callback_url: callbackUrl,
            metadata: {
              paymentId,
              tenantId: tenant.id,
              userId: payment.userId,
            },
          }),
        });

        const data = await paystackResponse.json();

        if (data.status) {
          return NextResponse.json({
            success: true,
            reference,
            authorizationUrl: data.data.authorization_url,
            accessCode: data.data.access_code,
          });
        } else {
          throw new Error(data.message || 'Paystack initialization failed');
        }
      } catch (error) {
        console.error('Paystack API error:', error);
        // Fall through to mock response
      }
    }

    if (!allowMockTenantPayments()) {
      return NextResponse.json(
        { error: 'Online card payments are not available right now. Please use EFT instead.' },
        { status: 503 }
      );
    }

    // Mock response for development / explicitly enabled beta environments
    const mockReference = `MOCK-${payment.paymentReference}-${Date.now()}`;
    const mockPaymentUrl = `${baseUrl}/portal/payments/${paymentId}/pay/mock?reference=${mockReference}&amount=${amount}`;

    return NextResponse.json({
      success: true,
      reference: mockReference,
      authorizationUrl: mockPaymentUrl,
      accessCode: `mock_${mockReference}`,
      mock: true,
    });
  } catch (error) {
    console.error('Paystack initialization error:', error);
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}
