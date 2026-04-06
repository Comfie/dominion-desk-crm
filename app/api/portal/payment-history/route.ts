import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PaymentStatus } from '@prisma/client';
import { logger } from '@/lib/shared/logger';
import { handleApiError } from '@/lib/shared/errors';
import { getTenantBySessionEmail } from '@/lib/tenant-session';

/**
 * GET /api/portal/payment-history
 * Retrieve payment history for authenticated tenant
 *
 * Query params:
 * - year: number (optional, filters to specific year)
 * - page: number (optional, defaults to 1)
 * - limit: number (optional, defaults to 20)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantBySessionEmail(session.user.email);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    const tenantId = tenant.id;
    const searchParams = req.nextUrl.searchParams;

    // Parse query parameters
    const yearParam = searchParams.get('year');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // Validate parameters
    if (yearParam && (isNaN(year!) || year! < 2000 || year! > 2100)) {
      return NextResponse.json(
        { error: 'Invalid year. Must be between 2000 and 2100.' },
        { status: 400 }
      );
    }

    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: 'Invalid page number.' }, { status: 400 });
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit. Must be between 1 and 100.' },
        { status: 400 }
      );
    }

    // Build date filter
    const whereDate: any = {};
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      whereDate.dueDate = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    // Get total count
    const totalCount = await prisma.payment.count({
      where: {
        tenantId,
        ...whereDate,
      },
    });

    // Get paginated payments
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        ...whereDate,
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
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate running balance for each payment
    let runningBalance = 0;
    const paymentsWithBalance = payments
      .reverse()
      .map((payment) => {
        if (payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.REFUNDED) {
          runningBalance += Number(payment.amount);
        } else if (payment.status === PaymentStatus.REFUNDED) {
          runningBalance -= Number(payment.amount);
        }

        return {
          id: payment.id,
          date: payment.paymentDate || payment.dueDate || payment.createdAt,
          description: payment.description || `${payment.paymentType} payment`,
          amount: Number(payment.amount),
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          invoiceNumber: payment.invoiceNumber,
          invoiceUrl: payment.invoiceUrl,
          receiptUrl: payment.receiptUrl,
          dueDate: payment.dueDate,
          paymentDate: payment.paymentDate,
          paymentType: payment.paymentType,
          property: payment.property,
          landlord: payment.user,
          runningBalance,
          proofOfPaymentUrl: payment.proofOfPaymentUrl,
          proofUploadedAt: payment.proofUploadedAt,
        };
      })
      .reverse();

    // Calculate summary statistics
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const [yearPayments, paidThisYear, onTimePayments, nextPayment] = await Promise.all([
      // Total paid this year
      prisma.payment.aggregate({
        where: {
          tenantId,
          status: PaymentStatus.PAID,
          paymentDate: {
            gte: startOfYear,
          },
        },
        _sum: { amount: true },
      }),
      // Count of paid payments this year
      prisma.payment.count({
        where: {
          tenantId,
          status: PaymentStatus.PAID,
          paymentDate: {
            gte: startOfYear,
          },
        },
      }),
      // On-time payments this year
      prisma.payment.count({
        where: {
          tenantId,
          status: PaymentStatus.PAID,
          paymentDate: {
            gte: startOfYear,
          },
          AND: [
            {
              paymentDate: {
                not: null,
              },
            },
            {
              dueDate: {
                not: null,
              },
            },
          ],
        },
      }),
      // Next payment due
      prisma.payment.findFirst({
        where: {
          tenantId,
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE],
          },
          dueDate: {
            gte: now,
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      }),
    ]);

    const totalPaidThisYear = Number(yearPayments._sum.amount || 0);

    // Calculate current outstanding balance
    const outstandingPayments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE, PaymentStatus.PENDING_VERIFICATION],
        },
      },
    });
    const outstandingBalance = outstandingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const summary = {
      totalPaidThisYear,
      monthsOnTime: onTimePayments,
      totalPayments: paidThisYear,
      nextPaymentDue: nextPayment
        ? {
            amount: Number(nextPayment.amount),
            dueDate: nextPayment.dueDate,
            description: nextPayment.description,
          }
        : null,
      outstandingBalance,
    };

    logger.info('Tenant portal payment history retrieved', {
      tenantId,
      year,
      page,
      limit,
      totalCount,
    });

    return NextResponse.json({
      payments: paymentsWithBalance,
      summary,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
