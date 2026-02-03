import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { paymentService } from '@/lib/features/payments';
import { notifyPaymentReceived } from '@/lib/notifications';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

// Query params schema
const listQuerySchema = z.object({
  bookingId: z.string().optional(),
  tenantId: z.string().optional(),
  status: z
    .enum([
      'PENDING',
      'PENDING_VERIFICATION',
      'PARTIALLY_PAID',
      'PAID',
      'OVERDUE',
      'REFUNDED',
      'FAILED',
    ])
    .optional(),
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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Create payment schema
const createPaymentSchema = z.object({
  tenantId: z.string().optional(),
  bookingId: z.string().optional(),
  propertyId: z.string().optional(),
  paymentType: z.enum([
    'RENT',
    'DEPOSIT',
    'BOOKING',
    'CLEANING_FEE',
    'UTILITIES',
    'LATE_FEE',
    'DAMAGE',
    'REFUND',
    'OTHER',
  ]),
  amount: z.number().positive(),
  currency: z.string().default('ZAR'),
  paymentMethod: z
    .enum(['CASH', 'EFT', 'CREDIT_CARD', 'DEBIT_CARD', 'PAYSTACK', 'PAYPAL', 'OTHER'])
    .optional(),
  paymentDate: z.string().transform((v) => new Date(v)),
  status: z.enum(['PENDING', 'PAID', 'FAILED']).default('PAID'),
  notes: z.string().optional(),
  bankReference: z.string().optional(),
});

/**
 * GET /api/payments - List all payments with pagination and filters
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = listQuerySchema.parse({
      bookingId: searchParams.get('bookingId') || undefined,
      tenantId: searchParams.get('tenantId') || undefined,
      status: searchParams.get('status') || undefined,
      paymentType: searchParams.get('paymentType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    // Build where clause
    const where = {
      userId: session.user.id,
      ...(params.bookingId && { bookingId: params.bookingId }),
      ...(params.tenantId && { tenantId: params.tenantId }),
      ...(params.status && { status: params.status }),
      ...(params.paymentType && { paymentType: params.paymentType }),
      ...(params.startDate &&
        params.endDate && {
          paymentDate: {
            gte: new Date(params.startDate),
            lte: new Date(params.endDate),
          },
        }),
    };

    // Fetch paginated data and total
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
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
          propertyId: true,
          // Proof of payment fields
          proofOfPaymentUrl: true,
          proofOfPaymentName: true,
          proofUploadedAt: true,
          proofNotes: true,
          verifiedAt: true,
          verifiedBy: true,
          verificationNotes: true,
          property: { select: { id: true, name: true, address: true } },
          booking: {
            select: {
              id: true,
              guestName: true,
              property: { select: { id: true, name: true } },
            },
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              properties: {
                select: { property: { select: { id: true, name: true, address: true } } },
                take: 1,
              },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    // Calculate summary
    const allPaymentStats = await prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    const paidSum = await prisma.payment.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { amount: true },
    });

    const pendingSum = await prisma.payment.aggregate({
      where: { ...where, status: 'PENDING' },
      _sum: { amount: true },
    });

    return NextResponse.json({
      data: payments,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
      summary: {
        totalAmount: Number(allPaymentStats._sum.amount || 0),
        paidAmount: Number(paidSum._sum.amount || 0),
        pendingAmount: Number(pendingSum._sum.amount || 0),
        count: allPaymentStats._count,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

/**
 * POST /api/payments - Create a new payment
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createPaymentSchema.parse(body);

    // Generate payment reference
    const paymentCount = await prisma.payment.count({ where: { userId: session.user.id } });
    const paymentReference = `PAY-${Date.now()}-${(paymentCount + 1).toString().padStart(4, '0')}`;

    // Determine propertyId from tenant if not provided
    let propertyId = data.propertyId || null;
    if (!propertyId && data.tenantId) {
      const tenantProperty = await prisma.propertyTenant.findFirst({
        where: { tenantId: data.tenantId, isActive: true },
        select: { propertyId: true },
      });
      propertyId = tenantProperty?.propertyId || null;
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        paymentReference,
        bookingId: data.bookingId || null,
        tenantId: data.tenantId || null,
        propertyId,
        paymentType: data.paymentType,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        status: data.status,
        notes: data.notes || null,
        bankReference: data.bankReference || null,
      },
      include: {
        booking: {
          select: { id: true, guestName: true, property: { select: { id: true, name: true } } },
        },
        tenant: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Update booking payment status if linked
    if (data.bookingId) {
      await updateBookingPaymentStatus(data.bookingId);
    }

    // Advance tenant next payment due if RENT paid
    if (payment.paymentType === 'RENT' && payment.status === 'PAID' && payment.tenantId) {
      await advanceTenantPaymentDue(session.user.id, payment.tenantId, data.paymentDate);
    }

    // Send notification
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
    } catch (e) {
      console.error('Failed to create notification:', e);
    }

    // Trigger PAYMENT_RECEIVED automation if payment is PAID
    if (payment.status === 'PAID' && payment.tenantId) {
      try {
        const { messageSchedulerService } =
          await import('@/lib/features/messaging/services/message-scheduler.service');
        const { AutomationTrigger } = await import('@prisma/client');
        // Note: This uses tenant context, not booking
        // TODO: Extend scheduler service to support tenant-based messages
        console.log('PAYMENT_RECEIVED automation would trigger here for tenant:', payment.tenantId);
      } catch (automationError) {
        console.error('Failed to schedule PAYMENT_RECEIVED automation:', automationError);
      }
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
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
