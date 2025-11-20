import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/payments/[id] - Get a single payment
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
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
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
  }
}

// PUT /api/payments/[id] - Update a payment
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if payment exists and belongs to user
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        paymentType: data.paymentType,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
        status: data.status,
        notes: data.notes,
        bankReference: data.bankReference,
      },
      include: {
        booking: {
          select: {
            id: true,
            guestName: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update booking payment status if linked to a booking
    if (payment.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        select: { totalAmount: true },
      });

      if (booking) {
        const totalPaid = await prisma.payment.aggregate({
          where: {
            bookingId: payment.bookingId,
            status: 'PAID',
          },
          _sum: {
            amount: true,
          },
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

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

// DELETE /api/payments/[id] - Delete a payment
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if payment exists and belongs to user
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const bookingId = existingPayment.bookingId;

    await prisma.payment.delete({
      where: { id },
    });

    // Update booking payment status if was linked to a booking
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { totalAmount: true },
      });

      if (booking) {
        const totalPaid = await prisma.payment.aggregate({
          where: {
            bookingId,
            status: 'PAID',
          },
          _sum: {
            amount: true,
          },
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
    }

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
