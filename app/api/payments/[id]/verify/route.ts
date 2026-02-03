import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

/**
 * POST /api/payments/[id]/verify
 * Verify (approve/reject) a payment proof
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id: paymentId } = await params;

    // Only landlords (CUSTOMER role) can verify payments
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized - Landlords only' }, { status: 403 });
    }

    // Get the payment and verify it belongs to this landlord
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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

    // Check if payment has proof uploaded
    if (!payment.proofOfPaymentUrl) {
      return NextResponse.json(
        { error: 'No proof of payment uploaded for this payment' },
        { status: 400 }
      );
    }

    // Check if payment is in valid status for verification
    if (payment.status !== 'PENDING_VERIFICATION') {
      return NextResponse.json({ error: 'Payment is not pending verification' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { action, notes } = body;

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    let updatedPayment;

    if (action === 'approve') {
      // Approve the payment - mark as PAID
      updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paymentDate: new Date(),
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          verificationNotes: notes || null,
        },
        include: {
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      // If payment is linked to a booking, update booking payment status
      if (payment.bookingId) {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paymentStatus: 'PAID',
            amountPaid: { increment: payment.amount },
          },
        });
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'verified',
          entity: 'payment',
          entityId: paymentId,
          changes: {
            action: 'approve',
            previousStatus: 'PENDING_VERIFICATION',
            newStatus: 'PAID',
            notes: notes || null,
          },
        },
      });
    } else {
      // Reject the proof - move back to PENDING status
      updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PENDING',
          verificationNotes: notes || 'Payment proof rejected by landlord',
          // Keep the proof URL for reference but clear verification timestamp
          verifiedAt: null,
          verifiedBy: null,
        },
        include: {
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'rejected',
          entity: 'payment',
          entityId: paymentId,
          changes: {
            action: 'reject',
            previousStatus: 'PENDING_VERIFICATION',
            newStatus: 'PENDING',
            notes: notes || null,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message:
        action === 'approve'
          ? 'Payment has been verified and marked as paid'
          : 'Payment proof has been rejected',
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}

/**
 * GET /api/payments/[id]/verify
 * Get proof details for a payment (landlord view)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id: paymentId } = await params;

    // Only landlords (CUSTOMER role) can view payment proofs
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized - Landlords only' }, { status: 403 });
    }

    // Get the payment and verify it belongs to this landlord
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
      },
      select: {
        id: true,
        paymentReference: true,
        amount: true,
        currency: true,
        status: true,
        proofOfPaymentUrl: true,
        proofOfPaymentName: true,
        proofUploadedAt: true,
        proofNotes: true,
        verifiedAt: true,
        verifiedBy: true,
        verificationNotes: true,
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment proof:', error);
    return NextResponse.json({ error: 'Failed to fetch payment proof' }, { status: 500 });
  }
}
