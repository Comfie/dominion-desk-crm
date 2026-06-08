import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { paymentService } from '@/lib/features/payments/services/payment.service';
import { getArrearsWorkflow } from '@/lib/features/tasks/utils/landlord-workflows';
import { PaymentStatus } from '@prisma/client';
import { logger } from '@/lib/shared/logger';
import { handleApiError } from '@/lib/shared/errors';

/**
 * GET /api/rent-collection
 * Retrieve rent collection grid data for a specific month
 *
 * Query params:
 * - month: number (1-12)
 * - year: number
 * - propertyId: string (optional, defaults to 'all')
 * - status: PaymentStatus (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams;

    // Parse and validate query parameters
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    const propertyId = searchParams.get('propertyId') || 'all';
    const statusParam = searchParams.get('status');

    // Default to current month if not provided
    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    // Validate month and year
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month. Must be between 1 and 12.' },
        { status: 400 }
      );
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid year. Must be between 2000 and 2100.' },
        { status: 400 }
      );
    }

    // Validate status if provided
    let status: PaymentStatus | undefined;
    if (statusParam && statusParam !== 'all') {
      if (!Object.values(PaymentStatus).includes(statusParam as PaymentStatus)) {
        return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
      }
      status = statusParam as PaymentStatus;
    }

    // Get rent collection data
    const data = await paymentService.getRentCollectionData(userId, month, year, {
      propertyId,
      status,
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const manualInvoicePayments = await prisma.payment.findMany({
      where: {
        userId,
        invoiceNumber: {
          startsWith: 'INV-MANUAL-',
        },
        dueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        ...(propertyId && propertyId !== 'all' ? { propertyId } : {}),
        ...(status ? { status } : {}),
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
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    });

    const manualInvoices = manualInvoicePayments.map((payment) => ({
      id: payment.id,
      invoiceNumber: payment.invoiceNumber,
      amount: Number(payment.amount),
      status: payment.status,
      dueDate: payment.dueDate,
      paymentDate: payment.paymentDate,
      paymentType: payment.paymentType,
      description: payment.description,
      notes: payment.notes,
      reminderCount: payment.reminderCount,
      reminderSentAt: payment.reminderSentAt,
      tenant: payment.tenant,
      property: payment.property,
    }));

    const paymentIds = data.properties.flatMap((property) =>
      property.tenants
        .map((tenant) => tenant.payment?.id)
        .filter((paymentId): paymentId is string => Boolean(paymentId))
    );

    const followUpTasks =
      paymentIds.length > 0
        ? await prisma.task.findMany({
            where: {
              userId,
              taskType: 'PAYMENT_REMINDER',
              relatedType: 'payment',
              relatedId: { in: paymentIds },
              status: { in: ['TODO', 'IN_PROGRESS'] },
            },
            select: {
              id: true,
              relatedId: true,
              status: true,
              priority: true,
              dueDate: true,
            },
          })
        : [];

    const followUpTaskMap = new Map(
      followUpTasks.map((task) => [task.relatedId, task] as const).filter((entry) => entry[0])
    );

    const enrichedProperties = data.properties.map((property) => ({
      ...property,
      tenants: property.tenants.map((tenant) => {
        const arrearsWorkflow = tenant.payment
          ? getArrearsWorkflow(
              tenant.payment.status,
              tenant.payment.dueDate ? new Date(tenant.payment.dueDate) : null
            )
          : null;

        return {
          ...tenant,
          arrearsWorkflow: arrearsWorkflow
            ? {
                ...arrearsWorkflow,
                task: followUpTaskMap.get(tenant.payment!.id) || null,
              }
            : null,
        };
      }),
    }));

    const paymentsWithoutFollowUpTask = enrichedProperties.reduce((count, property) => {
      return (
        count +
        property.tenants.filter((tenant) => tenant.arrearsWorkflow && !tenant.arrearsWorkflow.task)
          .length
      );
    }, 0);

    logger.info('Rent collection data retrieved', {
      userId,
      month,
      year,
      propertyId,
      status,
      propertiesCount: data.properties.length,
    });

    return NextResponse.json({
      ...data,
      properties: enrichedProperties,
      manualInvoices,
      summary: {
        ...data.summary,
        openFollowUpTasks: followUpTasks.length,
        paymentsWithoutFollowUpTask,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
