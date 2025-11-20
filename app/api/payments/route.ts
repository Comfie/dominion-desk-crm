import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { notifyPaymentReceived } from '@/lib/notifications';

// GET /api/payments - List all payments
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const paymentType = searchParams.get('paymentType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        ...(bookingId && { bookingId }),
        ...(tenantId && { tenantId }),
        ...(status && {
          status: status as 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED' | 'FAILED',
        }),
        ...(paymentType && {
          paymentType: paymentType as
            | 'RENT'
            | 'DEPOSIT'
            | 'BOOKING'
            | 'CLEANING_FEE'
            | 'UTILITIES'
            | 'LATE_FEE'
            | 'DAMAGE'
            | 'REFUND'
            | 'OTHER',
        }),
        ...(startDate &&
          endDate && {
            paymentDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
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
      orderBy: {
        paymentDate: 'desc',
      },
    });

    // Calculate summary statistics
    const summary = {
      totalAmount: payments.reduce(
        (sum: number, p: (typeof payments)[number]) => sum + Number(p.amount),
        0
      ),
      pendingAmount: payments
        .filter((p: (typeof payments)[number]) => p.status === 'PENDING')
        .reduce((sum: number, p: (typeof payments)[number]) => sum + Number(p.amount), 0),
      paidAmount: payments
        .filter((p: (typeof payments)[number]) => p.status === 'PAID')
        .reduce((sum: number, p: (typeof payments)[number]) => sum + Number(p.amount), 0),
      count: payments.length,
    };

    return NextResponse.json({ payments, summary });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Generate payment reference
    const paymentCount = await prisma.payment.count({
      where: { userId: session.user.id },
    });
    const paymentReference = `PAY-${Date.now()}-${(paymentCount + 1).toString().padStart(4, '0')}`;

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        paymentReference,
        bookingId: data.bookingId || null,
        tenantId: data.tenantId || null,
        paymentType: data.paymentType,
        amount: data.amount,
        currency: data.currency || 'ZAR',
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
        status: data.status || 'PAID',
        notes: data.notes || null,
        bankReference: data.bankReference || null,
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
    if (data.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        select: { totalAmount: true },
      });

      if (booking) {
        const totalPaid = await prisma.payment.aggregate({
          where: {
            bookingId: data.bookingId,
            status: 'PAID',
          },
          _sum: {
            amount: true,
          },
        });

        const amountPaid = Number(totalPaid._sum.amount || 0);
        const totalAmount = Number(booking.totalAmount);

        await prisma.booking.update({
          where: { id: data.bookingId },
          data: {
            amountPaid,
            amountDue: totalAmount - amountPaid,
            paymentStatus:
              amountPaid >= totalAmount ? 'PAID' : amountPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING',
          },
        });
      }
    }

    // Create notification for payment received
    try {
      const payerName = payment.tenant
        ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
        : payment.booking?.guestName || 'Unknown';

      await notifyPaymentReceived(
        session.user.id,
        `R${Number(payment.amount).toLocaleString()}`,
        payerName,
        payment.id
      );
    } catch (notifyError) {
      console.error('Failed to create notification:', notifyError);
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
