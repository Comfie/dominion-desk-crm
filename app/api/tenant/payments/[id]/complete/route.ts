import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { getTenantForPortalSession } from '@/lib/tenant-session';
import { allowMockTenantPayments } from '@/lib/features/payments/utils/mock-payments';

/**
 * POST /api/tenant/payments/[id]/complete
 * Complete a payment after successful online payment
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
    const tenant = await getTenantForPortalSession(session.user.id, session.user.email);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    // Get request body
    const { reference, status, paymentMethod } = await request.json();

    if (!reference || status !== 'success') {
      return NextResponse.json({ error: 'Invalid payment completion request' }, { status: 400 });
    }

    if (reference.startsWith('MOCK-') && !allowMockTenantPayments()) {
      return NextResponse.json(
        { error: 'Mock payment completion is disabled in this environment' },
        { status: 400 }
      );
    }

    // Get the payment and verify it belongs to this tenant
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId: tenant.id,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Check payment is in valid status for completion
    if (payment.status !== 'PENDING' && payment.status !== 'OVERDUE') {
      return NextResponse.json(
        { error: 'Payment is not in a completable status' },
        { status: 400 }
      );
    }

    // Update payment status to PAID
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paymentDate: new Date(),
        paymentMethod: paymentMethod || 'CREDIT_CARD',
        bankReference: reference,
      },
    });

    // If payment is linked to a booking, update booking payment status
    if (payment.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        select: { totalAmount: true },
      });

      if (booking) {
        const totalPaid = await prisma.payment.aggregate({
          where: { bookingId: payment.bookingId, status: 'PAID' },
          _sum: { amount: true },
        });

        const amountPaid = Number(totalPaid._sum.amount || 0);
        const totalAmount = Number(booking.totalAmount);

        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            amountPaid,
            amountDue: totalAmount - amountPaid,
            paymentStatus:
              amountPaid >= totalAmount ? 'PAID' : amountPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING',
          },
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: payment.userId,
        action: 'paid_online',
        entity: 'payment',
        entityId: paymentId,
        changes: {
          previousStatus: payment.status,
          newStatus: 'PAID',
          paymentMethod: paymentMethod || 'CREDIT_CARD',
          reference,
          paidBy: tenant.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Payment completed successfully',
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    return NextResponse.json({ error: 'Failed to complete payment' }, { status: 500 });
  }
}
