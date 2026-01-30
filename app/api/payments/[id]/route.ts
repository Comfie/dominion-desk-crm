import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { paymentService } from '@/lib/features/payments';
import { NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

// Update payment schema
const updatePaymentSchema = z.object({
  paymentType: z
    .enum([
      'RENT',
      'DEPOSIT',
      'BOOKING',
      'CLEANING_FEE',
      'UTILITIES',
      'LATE_FEE',
      'DAMAGE',
      'REFUND',
      'OTHER',
    ])
    .optional(),
  amount: z.number().positive().optional(),
  paymentMethod: z
    .enum(['CASH', 'EFT', 'CREDIT_CARD', 'DEBIT_CARD', 'PAYSTACK', 'PAYPAL', 'OTHER'])
    .optional(),
  paymentDate: z
    .string()
    .transform((v) => new Date(v))
    .optional(),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  notes: z.string().optional(),
  bankReference: z.string().optional(),
});

const paymentIdSchema = z.object({
  id: z.string().min(1, 'Payment ID is required'),
});

/**
 * GET /api/payments/[id] - Get a single payment
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { id: paymentId } = paymentIdSchema.parse({ id });

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: session.user.id },
      include: {
        booking: {
          select: {
            id: true,
            guestName: true,
            guestEmail: true,
            guestPhone: true,
            checkInDate: true,
            checkOutDate: true,
            totalAmount: true,
            property: { select: { id: true, name: true, address: true, city: true } },
          },
        },
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
  }
}

/**
 * PUT /api/payments/[id] - Update a payment
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { id: paymentId } = paymentIdSchema.parse({ id });

    const body = await request.json();
    const data = updatePaymentSchema.parse(body);

    // Check ownership
    const existingPayment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: session.user.id },
      include: { tenant: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentType: data.paymentType,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        status: data.status,
        notes: data.notes,
        bankReference: data.bankReference,
      },
      include: {
        booking: {
          select: { id: true, guestName: true, property: { select: { id: true, name: true } } },
        },
        tenant: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Update booking status if linked
    if (payment.bookingId) {
      await updateBookingPaymentStatus(payment.bookingId);
    }

    // Advance tenant due date if RENT marked as PAID
    if (payment.paymentType === 'RENT' && data.status === 'PAID' && payment.tenantId) {
      const paymentDate = data.paymentDate || payment.paymentDate || new Date();
      await advanceTenantPaymentDue(session.user.id, payment.tenantId, paymentDate);
    }

    return NextResponse.json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

/**
 * DELETE /api/payments/[id] - Delete a payment
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { id: paymentId } = paymentIdSchema.parse({ id });

    // Check ownership
    const existingPayment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: session.user.id },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const bookingId = existingPayment.bookingId;

    await prisma.payment.delete({ where: { id: paymentId } });

    // Update booking status if was linked
    if (bookingId) {
      await updateBookingPaymentStatus(bookingId);
    }

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}

// Helper: Update booking payment status
async function updateBookingPaymentStatus(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { totalAmount: true },
  });
  if (!booking) return;

  const totalPaid = await prisma.payment.aggregate({
    where: { bookingId, status: 'PAID' },
    _sum: { amount: true },
  });

  const amountPaid = Number(totalPaid._sum.amount || 0);
  const totalAmount = Number(booking.totalAmount);

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      amountPaid,
      amountDue: totalAmount - amountPaid,
      paymentStatus:
        amountPaid >= totalAmount ? 'PAID' : amountPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING',
    },
  });
}

// Helper: Advance tenant next payment due
async function advanceTenantPaymentDue(userId: string, tenantId: string, paymentDate: Date) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rentalDueDay: true },
  });

  const rentalDueDay = user?.rentalDueDay || 1;
  let nextMonth = paymentDate.getMonth() + 1;
  let nextYear = paymentDate.getFullYear();

  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear++;
  }

  const dueDay = Math.min(rentalDueDay, 28);
  const nextPaymentDue = new Date(nextYear, nextMonth, dueDay, 9, 0, 0);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { nextPaymentDue },
  });
}
