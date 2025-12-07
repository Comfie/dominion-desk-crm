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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where = {
      userId: session.user.id,
      ...(bookingId && { bookingId }),
      ...(tenantId && { tenantId }),
      ...(status && {
        status: status as 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'REFUNDED' | 'FAILED',
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
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          paymentReference: true,
          paymentType: true,
          amount: true,
          currency: true,
          paymentMethod: true,
          paymentDate: true,
          dueDate: true,
          status: true,
          description: true,
          notes: true,
          reminderSent: true,
          reminderSentAt: true,
          propertyId: true,
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
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
              email: true,
              properties: {
                select: {
                  property: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
      }),
      prisma.payment.count({ where }),
    ]);

    // Calculate summary statistics from all matching payments (not just current page)
    const allPayments = await prisma.payment.findMany({
      where,
      select: { amount: true, status: true },
    });

    const summary = {
      totalAmount: allPayments.reduce(
        (sum: number, p: (typeof allPayments)[number]) => sum + Number(p.amount),
        0
      ),
      pendingAmount: allPayments
        .filter((p: (typeof allPayments)[number]) => p.status === 'PENDING')
        .reduce((sum: number, p: (typeof allPayments)[number]) => sum + Number(p.amount), 0),
      paidAmount: allPayments
        .filter((p: (typeof allPayments)[number]) => p.status === 'PAID')
        .reduce((sum: number, p: (typeof allPayments)[number]) => sum + Number(p.amount), 0),
      count: allPayments.length,
    };

    return NextResponse.json({
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    });
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

    // Determine propertyId from tenant if not provided
    let propertyId = data.propertyId || null;
    if (!propertyId && data.tenantId) {
      const tenantProperty = await prisma.propertyTenant.findFirst({
        where: {
          tenantId: data.tenantId,
          isActive: true,
        },
        select: {
          propertyId: true,
        },
      });
      if (tenantProperty) {
        propertyId = tenantProperty.propertyId;
      }
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        paymentReference,
        bookingId: data.bookingId || null,
        tenantId: data.tenantId || null,
        propertyId: propertyId,
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

    // Automatically advance nextPaymentDue when a RENT payment is created as PAID
    if (payment.paymentType === 'RENT' && payment.status === 'PAID' && payment.tenantId) {
      // Get user's rental due day setting
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { rentalDueDay: true },
      });

      const rentalDueDay = user?.rentalDueDay || 1;

      // Calculate next payment due date based on payment date
      const paymentDate = new Date(data.paymentDate);
      let nextMonth = paymentDate.getMonth() + 1;
      let nextYear = paymentDate.getFullYear();

      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }

      // Cap at 28 to avoid month-end issues
      const dueDay = Math.min(rentalDueDay, 28);
      const nextPaymentDue = new Date(nextYear, nextMonth, dueDay, 9, 0, 0);

      // Update tenant's nextPaymentDue
      await prisma.tenant.update({
        where: { id: payment.tenantId },
        data: { nextPaymentDue },
      });

      console.log(
        `Advanced nextPaymentDue for tenant ${payment.tenant?.firstName} ${payment.tenant?.lastName} to ${nextPaymentDue.toDateString()}`
      );
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
