import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

/**
 * POST /api/tenant/payments/[id]/proof
 * Upload proof of payment for a specific payment
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id: paymentId } = await params;

    // Check if user is a tenant
    if (session.user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Unauthorized - Tenants only' }, { status: 403 });
    }

    // Find tenant record for this user
    const tenant = await prisma.tenant.findFirst({
      where: { email: session.user.email || '' },
    });

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
            name: true,
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

    // Check if payment is in a valid status for proof upload
    if (payment.status !== 'PENDING' && payment.status !== 'OVERDUE') {
      return NextResponse.json(
        { error: 'Proof of payment can only be uploaded for pending or overdue payments' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { proofUrl, proofFileName, notes } = body;

    if (!proofUrl || !proofFileName) {
      return NextResponse.json({ error: 'Proof URL and filename are required' }, { status: 400 });
    }

    // Update payment with proof details
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        proofOfPaymentUrl: proofUrl,
        proofOfPaymentName: proofFileName,
        proofUploadedAt: new Date(),
        proofUploadedBy: tenant.id,
        proofNotes: notes || null,
        status: 'PENDING_VERIFICATION',
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
            email: true,
          },
        },
      },
    });

    // Notify landlord about proof upload
    const tenantName = `${tenant.firstName} ${tenant.lastName}`;
    const amountStr = `${updatedPayment.currency} ${Number(updatedPayment.amount).toFixed(2)}`;

    await createNotification({
      userId: payment.userId,
      title: 'Payment proof uploaded',
      message: `${tenantName} uploaded proof of payment for ${amountStr} (Ref: ${payment.paymentReference})`,
      type: 'PAYMENT',
      linkUrl: `/financials/income?payment=${paymentId}`,
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Proof of payment uploaded successfully. Your landlord will verify it shortly.',
    });
  } catch (error) {
    console.error('Error uploading proof of payment:', error);
    return NextResponse.json({ error: 'Failed to upload proof of payment' }, { status: 500 });
  }
}

/**
 * GET /api/tenant/payments/[id]/proof
 * Get proof of payment details for a specific payment
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
    const tenant = await prisma.tenant.findFirst({
      where: { email: session.user.email || '' },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    // Get the payment and verify it belongs to this tenant
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        proofOfPaymentUrl: true,
        proofOfPaymentName: true,
        proofUploadedAt: true,
        proofNotes: true,
        status: true,
        verifiedAt: true,
        verificationNotes: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or does not belong to you' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      proofOfPaymentUrl: payment.proofOfPaymentUrl,
      proofOfPaymentName: payment.proofOfPaymentName,
      proofUploadedAt: payment.proofUploadedAt,
      proofNotes: payment.proofNotes,
      status: payment.status,
      verifiedAt: payment.verifiedAt,
      verificationNotes: payment.verificationNotes,
    });
  } catch (error) {
    console.error('Error fetching proof of payment:', error);
    return NextResponse.json({ error: 'Failed to fetch proof of payment' }, { status: 500 });
  }
}
