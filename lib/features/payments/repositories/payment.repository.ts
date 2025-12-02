import { Prisma, PaymentStatus, PaymentType } from '@prisma/client';
import { prisma } from '@/lib/db';

export type PaymentWithDetails = Prisma.PaymentGetPayload<{
  include: {
    tenant: {
      include: {
        properties: {
          include: {
            property: true;
          };
        };
      };
    };
    property: true;
    user: true;
    booking: true;
  };
}>;

/**
 * Payment Repository
 * Handles all database operations for payments
 */
export class PaymentRepository {
  /**
   * Find payment by ID
   */
  async findById(id: string, userId?: string): Promise<PaymentWithDetails | null> {
    return prisma.payment.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
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
          include: {
            properties: {
              include: {
                property: true,
              },
            },
          },
        },
        property: true,
        user: true,
      },
    });
  }

  /**
   * Find all payments for a user
   */
  async findByUserId(
    userId: string,
    filters?: {
      bookingId?: string;
      status?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: Prisma.PaymentWhereInput = { userId };

    if (filters?.bookingId) {
      where.bookingId = filters.bookingId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.paymentDate.lte = filters.endDate;
      }
    }

    return prisma.payment.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  /**
   * Find payments by booking ID
   */
  async findByBookingId(bookingId: string) {
    return prisma.payment.findMany({
      where: { bookingId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  /**
   * Create a new payment
   */
  async create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({
      data,
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
          },
        },
      },
    });
  }

  /**
   * Update a payment
   */
  async update(id: string, data: Prisma.PaymentUpdateInput) {
    return prisma.payment.update({
      where: { id },
      data,
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
          },
        },
      },
    });
  }

  /**
   * Delete a payment
   */
  async delete(id: string) {
    return prisma.payment.delete({
      where: { id },
    });
  }

  /**
   * Get total payments for a booking
   */
  async getTotalPaidForBooking(bookingId: string) {
    const result = await prisma.payment.aggregate({
      where: {
        bookingId,
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Get payment statistics
   */
  async getStatistics(userId: string) {
    const [totalPayments, paidCount, pendingCount, failedCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { userId, status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { userId, status: 'PAID' } }),
      prisma.payment.count({ where: { userId, status: 'PENDING' } }),
      prisma.payment.count({ where: { userId, status: 'FAILED' } }),
    ]);

    return {
      totalAmount: Number(totalPayments._sum.amount || 0),
      paidCount,
      pendingCount,
      failedCount,
    };
  }

  /**
   * Get recent payments
   */
  async getRecent(userId: string, limit = 10) {
    return prisma.payment.findMany({
      where: { userId },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: limit,
    });
  }

  /**
   * Find payments due for reminders (with tenant details)
   */
  async findDuePayments(userId: string, dueDate: Date) {
    const startOfDay = new Date(dueDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dueDate);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.PENDING,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        reminderSent: {
          not: true,
        },
      },
      include: {
        tenant: {
          include: {
            properties: {
              include: {
                property: true,
              },
            },
          },
        },
        property: true,
        user: true,
        booking: true,
      },
    });
  }

  /**
   * Find overdue payments
   */
  async findOverduePayments(userId: string) {
    const now = new Date();

    return prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.PENDING,
        dueDate: {
          lt: now,
        },
      },
      include: {
        tenant: {
          include: {
            properties: {
              include: {
                property: true,
              },
            },
          },
        },
        property: true,
        user: true,
        booking: true,
      },
    });
  }

  /**
   * Mark payment as overdue
   */
  async markAsOverdue(id: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.OVERDUE,
      },
    });
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(id: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        reminderSent: true,
        reminderSentAt: new Date(),
        reminderCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Update invoice URL
   */
  async updateInvoiceUrl(id: string, invoiceUrl: string) {
    return prisma.payment.update({
      where: { id },
      data: { invoiceUrl },
    });
  }

  /**
   * Generate monthly payments for all active tenants
   */
  async generateMonthlyPayments(userId: string, month: number, year: number) {
    // Get user's rental due day setting
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rentalDueDay: true },
    });

    const rentalDueDay = user?.rentalDueDay || 1;

    // Find all active tenants with monthly rent configured
    const tenants = await prisma.tenant.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        monthlyRent: { not: null },
      },
      include: {
        properties: {
          include: {
            property: true,
          },
        },
      },
    });

    const payments: Prisma.PaymentCreateManyInput[] = [];
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    for (const tenant of tenants) {
      const property = tenant.properties[0]?.property;

      // Calculate due date using user's global rental due day setting
      const dueDay = Math.min(rentalDueDay, 28); // Cap at 28 to avoid month-end issues
      const dueDate = new Date(year, month - 1, dueDay, 9, 0, 0);

      // Check if payment already exists for this month
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);

      const existing = await prisma.payment.findFirst({
        where: {
          userId,
          tenantId: tenant.id,
          paymentType: PaymentType.RENT,
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      if (!existing && tenant.monthlyRent) {
        const monthName = monthNames[month - 1];
        const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const invoiceNumber = `INV-${year}${String(month).padStart(2, '0')}-${tenant.id.substring(0, 8)}`;

        const paymentData: Prisma.PaymentCreateManyInput = {
          userId,
          tenantId: tenant.id,
          propertyId: property?.id,
          paymentReference,
          paymentType: PaymentType.RENT,
          amount: tenant.monthlyRent,
          currency: 'ZAR',
          dueDate,
          status: PaymentStatus.PENDING,
          invoiceNumber,
          description: `Monthly rent for ${monthName} ${year}${property?.name ? ` - ${property.name}` : ''}`,
        };

        payments.push(paymentData);

        // Update tenant's nextPaymentDue
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { nextPaymentDue: dueDate },
        });
      }
    }

    if (payments.length > 0) {
      await prisma.payment.createMany({
        data: payments,
        skipDuplicates: true,
      });
    }

    return { count: payments.length, payments };
  }

  /**
   * Get payment summary statistics
   */
  async getPaymentSummary(userId: string, month?: number, year?: number) {
    const whereBase: Prisma.PaymentWhereInput = { userId };

    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      whereBase.dueDate = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const [total, pending, paid, overdue, totalAmount, paidAmount] = await Promise.all([
      prisma.payment.count({ where: whereBase }),
      prisma.payment.count({ where: { ...whereBase, status: PaymentStatus.PENDING } }),
      prisma.payment.count({ where: { ...whereBase, status: PaymentStatus.PAID } }),
      prisma.payment.count({ where: { ...whereBase, status: PaymentStatus.OVERDUE } }),
      prisma.payment.aggregate({
        where: whereBase,
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { ...whereBase, status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      pending,
      paid,
      overdue,
      totalAmount: Number(totalAmount._sum.amount || 0),
      paidAmount: Number(paidAmount._sum.amount || 0),
      pendingAmount: Number(totalAmount._sum.amount || 0) - Number(paidAmount._sum.amount || 0),
    };
  }
}

// Export singleton instance
export const paymentRepository = new PaymentRepository();
